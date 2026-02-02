/**
 * ============================================
 * STRIPE SERVICE LAYER
 * ============================================
 *
 * Core service for all Stripe payment operations.
 * Handles customer management, checkout sessions,
 * subscriptions, and billing portal.
 */

import Stripe from 'stripe';
import prisma from '../prisma.js';

// Initialize Stripe with API key (uses SDK's default API version)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get the Stripe instance
 * @returns {Stripe} Stripe instance
 */
export function getStripe() {
  return stripe;
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

/**
 * Create a new Stripe customer for an organization
 *
 * @param {Object} params
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.email - Billing email
 * @param {string} params.name - Organization name
 * @returns {Promise<Stripe.Customer>}
 */
export async function createCustomer({ organizationId, email, name }) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organizationId,
        source: 'edwind'
      }
    });

    console.log(`💳 [STRIPE] Created customer ${customer.id} for org ${organizationId}`);

    // Update subscription with Stripe customer ID
    await prisma.subscriptions.update({
      where: { organizationId },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Failed to create customer:', error.message);
    throw error;
  }
}

/**
 * Get or create a Stripe customer for an organization
 * Idempotent - returns existing customer if one exists
 *
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Stripe.Customer>}
 */
export async function getOrCreateCustomer(organizationId) {
  // Check if customer already exists in subscription record
  const subscription = await prisma.subscriptions.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true }
  });

  // If we have a Stripe customer ID, retrieve it
  if (subscription?.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
      if (!customer.deleted) {
        return customer;
      }
    } catch (error) {
      // Customer doesn't exist in Stripe, create new one
      console.log(`💳 [STRIPE] Customer ${subscription.stripeCustomerId} not found, creating new`);
    }
  }

  // Get organization details
  const organization = await prisma.organizations.findUnique({
    where: { id: organizationId },
    select: { title: true }
  });

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  // Get billing email from organization admin
  const adminUser = await prisma.user.findFirst({
    where: {
      organization_memberships: {
        some: {
          organizationId,
          workos_role: { in: ['owner', 'admin', 'Admin', 'Owner'] }
        }
      }
    },
    select: { email: true }
  });

  // Create new customer (without updating subscription - that happens later)
  const customer = await stripe.customers.create({
    email: adminUser?.email || `billing@${organization.title.toLowerCase().replace(/\s+/g, '')}.com`,
    name: organization.title,
    metadata: {
      organizationId,
      source: 'edwind'
    }
  });

  console.log(`💳 [STRIPE] Created customer ${customer.id} for org ${organizationId}`);

  // Update subscription record if it exists
  if (subscription) {
    await prisma.subscriptions.update({
      where: { organizationId },
      data: { stripeCustomerId: customer.id }
    });
  }

  return customer;
}

// ============================================
// CHECKOUT SESSIONS
// ============================================

/**
 * Create a Stripe Checkout session for subscription
 *
 * @param {Object} params
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.priceId - Stripe Price ID
 * @param {string} params.successUrl - URL to redirect on success
 * @param {string} params.cancelUrl - URL to redirect on cancel
 * @param {string} params.interval - 'monthly' or 'annual'
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export async function createCheckoutSession({
  organizationId,
  priceId,
  successUrl,
  cancelUrl,
  interval = 'monthly'
}) {
  try {
    // Get or create customer
    const customer = await getOrCreateCustomer(organizationId);

    // Get the subscription to check current state
    const subscription = await prisma.subscriptions.findUnique({
      where: { organizationId },
      select: { stripeSubscriptionId: true }
    });

    // If already subscribed, use billing portal for changes
    if (subscription?.stripeSubscriptionId) {
      throw new Error('Organization already has an active subscription. Use billing portal to make changes.');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          organizationId,
          interval
        }
      },
      metadata: {
        organizationId,
        interval
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    });

    console.log(`💳 [STRIPE] Created checkout session ${session.id} for org ${organizationId}`);

    return session;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Failed to create checkout session:', error.message);
    throw error;
  }
}

// ============================================
// BILLING PORTAL
// ============================================

/**
 * Create a Stripe Customer Portal session
 *
 * @param {Object} params
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.returnUrl - URL to return to after portal
 * @param {string} [params.customerId] - Optional Stripe customer ID (if already known)
 * @returns {Promise<Stripe.BillingPortal.Session>}
 */
export async function createBillingPortalSession({ organizationId, returnUrl, customerId }) {
  try {
    let stripeCustomerId = customerId;

    // Get customer from database if not provided
    if (!stripeCustomerId) {
      const subscription = await prisma.subscriptions.findUnique({
        where: { organizationId },
        select: { stripeCustomerId: true }
      });
      stripeCustomerId = subscription?.stripeCustomerId;
    }

    if (!stripeCustomerId) {
      throw new Error('No Stripe customer found for this organization');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl
    });

    console.log(`💳 [STRIPE] Created billing portal session for org ${organizationId}`);

    return session;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Failed to create billing portal session:', error.message);
    throw error;
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Update a subscription's plan (upgrade/downgrade)
 *
 * @param {Object} params
 * @param {string} params.stripeSubscriptionId - Stripe Subscription ID
 * @param {string} params.newPriceId - New Stripe Price ID
 * @param {boolean} params.prorate - Whether to prorate (default: true)
 * @returns {Promise<Stripe.Subscription>}
 */
export async function updateSubscription({ stripeSubscriptionId, newPriceId, prorate = true }) {
  try {
    // Get current subscription to find the item ID
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (!subscription || subscription.status === 'canceled') {
      throw new Error('Subscription not found or already canceled');
    }

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId
        }
      ],
      proration_behavior: prorate ? 'create_prorations' : 'none'
    });

    console.log(`💳 [STRIPE] Updated subscription ${stripeSubscriptionId} to price ${newPriceId}`);

    return updatedSubscription;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Failed to update subscription:', error.message);
    throw error;
  }
}

/**
 * Cancel a subscription
 *
 * @param {Object} params
 * @param {string} params.stripeSubscriptionId - Stripe Subscription ID
 * @param {boolean} params.immediately - Cancel immediately or at period end
 * @returns {Promise<Stripe.Subscription>}
 */
export async function cancelSubscription({ stripeSubscriptionId, immediately = false }) {
  try {
    let canceledSubscription;

    if (immediately) {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
      console.log(`💳 [STRIPE] Canceled subscription ${stripeSubscriptionId} immediately`);
    } else {
      // Cancel at period end
      canceledSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      console.log(`💳 [STRIPE] Scheduled cancellation for subscription ${stripeSubscriptionId}`);
    }

    return canceledSubscription;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Failed to cancel subscription:', error.message);
    throw error;
  }
}

/**
 * Reactivate a subscription scheduled for cancellation
 *
 * @param {string} stripeSubscriptionId - Stripe Subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function reactivateSubscription(stripeSubscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    console.log(`💳 [STRIPE] Reactivated subscription ${stripeSubscriptionId}`);

    return subscription;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Failed to reactivate subscription:', error.message);
    throw error;
  }
}

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Construct and verify a webhook event
 *
 * @param {string|Buffer} rawBody - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Stripe.Event}
 */
export function constructWebhookEvent(rawBody, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('💳 [STRIPE_ERROR] Webhook signature verification failed:', error.message);
    throw error;
  }
}

// ============================================
// PRICE & PRODUCT UTILITIES
// ============================================

/**
 * Get the Stripe Price ID for a plan
 *
 * @param {string} planId - Plan ID (essential, professional, enterprise)
 * @param {string} interval - Billing interval (monthly, annual)
 * @returns {Promise<string|null>}
 */
export async function getPriceIdForPlan(planId, interval = 'monthly') {
  const plan = await prisma.subscription_plans.findUnique({
    where: { planId },
    select: {
      stripePriceId: true,
      stripeAnnualPriceId: true
    }
  });

  if (!plan) {
    return null;
  }

  return interval === 'annual' ? plan.stripeAnnualPriceId : plan.stripePriceId;
}

/**
 * Get plan details from a Stripe Price ID
 *
 * @param {string} priceId - Stripe Price ID
 * @returns {Promise<Object|null>}
 */
export async function getPlanFromPriceId(priceId) {
  const plan = await prisma.subscription_plans.findFirst({
    where: {
      OR: [
        { stripePriceId: priceId },
        { stripeAnnualPriceId: priceId }
      ]
    }
  });

  if (!plan) {
    return null;
  }

  const isAnnual = plan.stripeAnnualPriceId === priceId;

  return {
    ...plan,
    billingInterval: isAnnual ? 'annual' : 'monthly'
  };
}

/**
 * Retrieve a Stripe subscription
 *
 * @param {string} stripeSubscriptionId - Stripe Subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function getStripeSubscription(stripeSubscriptionId) {
  return await stripe.subscriptions.retrieve(stripeSubscriptionId);
}

/**
 * Retrieve a Stripe customer
 *
 * @param {string} stripeCustomerId - Stripe Customer ID
 * @returns {Promise<Stripe.Customer>}
 */
export async function getStripeCustomer(stripeCustomerId) {
  return await stripe.customers.retrieve(stripeCustomerId);
}

// ============================================
// EXPORTS
// ============================================

export default {
  getStripe,
  createCustomer,
  getOrCreateCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  constructWebhookEvent,
  getPriceIdForPlan,
  getPlanFromPriceId,
  getStripeSubscription,
  getStripeCustomer
};
