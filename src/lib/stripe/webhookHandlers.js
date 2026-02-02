/**
 * ============================================
 * STRIPE WEBHOOK EVENT HANDLERS
 * ============================================
 *
 * Handlers for processing Stripe webhook events.
 * Updates database state based on Stripe events.
 */

import prisma from '../prisma.js';
import { getPlanFromPriceId } from './stripeService.js';

/**
 * Handle checkout.session.completed event
 * Called when a customer completes checkout
 *
 * @param {Object} session - Stripe Checkout Session object
 */
export async function handleCheckoutCompleted(session) {
  const organizationId = session.metadata?.organizationId;
  const stripeSubscriptionId = session.subscription;
  const stripeCustomerId = session.customer;

  if (!organizationId || !stripeSubscriptionId) {
    console.error('💳 [WEBHOOK] Missing organizationId or subscriptionId in checkout session');
    return;
  }

  console.log(`💳 [WEBHOOK] Checkout completed for org ${organizationId}`);

  // Get subscription details from Stripe
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Get the price ID from the subscription
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  const plan = await getPlanFromPriceId(priceId);

  if (!plan) {
    console.error(`💳 [WEBHOOK] Unknown price ID: ${priceId}`);
    return;
  }

  // Create or update subscription in database (billingInterval fetched from Stripe when needed)
  const dbSubscription = await prisma.subscriptions.upsert({
    where: { organizationId },
    create: {
      organizationId,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeProductId: stripeSubscription.items.data[0]?.price?.product,
      stripePriceId: priceId,
      planId: plan.planId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId,
      stripeProductId: stripeSubscription.items.data[0]?.price?.product,
      stripePriceId: priceId,
      planId: plan.planId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    }
  });

  // Record in history
  await prisma.subscription_history.create({
    data: {
      subscriptionId: dbSubscription.id,
      eventType: 'checkout_completed',
      toPlanId: plan.planId,
      toStatus: stripeSubscription.status,
      reason: `Subscribed to ${plan.name} (${plan.billingInterval})`,
      changedBy: 'stripe_webhook',
      changedByRole: 'system',
      metadata: {
        stripeSessionId: session.id,
        stripeSubscriptionId,
        priceId
      }
    }
  });

  console.log(`💳 [WEBHOOK] Updated subscription for org ${organizationId} to ${plan.planId}`);
}

/**
 * Handle customer.subscription.updated event
 * Called when subscription is modified (plan change, renewal, etc.)
 *
 * @param {Object} subscription - Stripe Subscription object
 */
export async function handleSubscriptionUpdated(subscription) {
  const organizationId = subscription.metadata?.organizationId;

  // Find subscription by Stripe ID if no org ID in metadata
  let dbSubscription;
  if (organizationId) {
    dbSubscription = await prisma.subscriptions.findUnique({
      where: { organizationId }
    });
  } else {
    dbSubscription = await prisma.subscriptions.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    });
  }

  if (!dbSubscription) {
    console.log(`💳 [WEBHOOK] No matching subscription found for ${subscription.id}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = await getPlanFromPriceId(priceId);

  const previousPlanId = dbSubscription.planId;
  const previousStatus = dbSubscription.status;

  // Update subscription (billingInterval fetched from Stripe when needed)
  await prisma.subscriptions.update({
    where: { id: dbSubscription.id },
    data: {
      planId: plan?.planId || dbSubscription.planId,
      status: subscription.status,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
    }
  });

  // Record plan change in history if plan changed
  if (plan && plan.planId !== previousPlanId) {
    await prisma.subscription_history.create({
      data: {
        subscriptionId: dbSubscription.id,
        eventType: 'plan_changed',
        fromPlanId: previousPlanId,
        toPlanId: plan.planId,
        fromStatus: previousStatus,
        toStatus: subscription.status,
        reason: `Plan changed to ${plan.name}`,
        changedBy: 'stripe_webhook',
        changedByRole: 'system',
        metadata: {
          stripeSubscriptionId: subscription.id,
          priceId
        }
      }
    });
  }

  console.log(`💳 [WEBHOOK] Updated subscription ${subscription.id}`);
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled
 *
 * @param {Object} subscription - Stripe Subscription object
 */
export async function handleSubscriptionDeleted(subscription) {
  const dbSubscription = await prisma.subscriptions.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!dbSubscription) {
    console.log(`💳 [WEBHOOK] No matching subscription found for ${subscription.id}`);
    return;
  }

  const previousPlanId = dbSubscription.planId;
  const previousStatus = dbSubscription.status;

  // Update subscription status to canceled
  await prisma.subscriptions.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      // Clear Stripe subscription ID but keep customer ID for potential re-subscription
      stripeSubscriptionId: null,
      stripePriceId: null
    }
  });

  // Record in history
  await prisma.subscription_history.create({
    data: {
      subscriptionId: dbSubscription.id,
      eventType: 'canceled',
      fromPlanId: previousPlanId,
      fromStatus: previousStatus,
      toStatus: 'canceled',
      reason: 'Subscription canceled',
      changedBy: 'stripe_webhook',
      changedByRole: 'system',
      metadata: {
        stripeSubscriptionId: subscription.id
      }
    }
  });

  console.log(`💳 [WEBHOOK] Subscription ${subscription.id} canceled`);
}

/**
 * Handle invoice.paid event
 * Called when payment succeeds
 *
 * @param {Object} invoice - Stripe Invoice object
 */
export async function handleInvoicePaid(invoice) {
  const stripeSubscriptionId = invoice.subscription;

  if (!stripeSubscriptionId) {
    return; // One-time payment, not subscription
  }

  const dbSubscription = await prisma.subscriptions.findFirst({
    where: { stripeSubscriptionId }
  });

  if (!dbSubscription) {
    return;
  }

  // If subscription was past_due, update to active
  if (dbSubscription.status === 'past_due') {
    await prisma.subscriptions.update({
      where: { id: dbSubscription.id },
      data: { status: 'active' }
    });

    await prisma.subscription_history.create({
      data: {
        subscriptionId: dbSubscription.id,
        eventType: 'payment_succeeded',
        fromStatus: 'past_due',
        toStatus: 'active',
        reason: 'Payment successful - subscription reactivated',
        changedBy: 'stripe_webhook',
        changedByRole: 'system',
        metadata: {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid
        }
      }
    });

    console.log(`💳 [WEBHOOK] Subscription ${stripeSubscriptionId} reactivated after payment`);
  }
}

/**
 * Handle invoice.payment_failed event
 * Called when payment fails
 *
 * @param {Object} invoice - Stripe Invoice object
 */
export async function handleInvoicePaymentFailed(invoice) {
  const stripeSubscriptionId = invoice.subscription;

  if (!stripeSubscriptionId) {
    return;
  }

  const dbSubscription = await prisma.subscriptions.findFirst({
    where: { stripeSubscriptionId }
  });

  if (!dbSubscription) {
    return;
  }

  const previousStatus = dbSubscription.status;

  // Update status to past_due
  await prisma.subscriptions.update({
    where: { id: dbSubscription.id },
    data: { status: 'past_due' }
  });

  // Record in history
  await prisma.subscription_history.create({
    data: {
      subscriptionId: dbSubscription.id,
      eventType: 'payment_failed',
      fromStatus: previousStatus,
      toStatus: 'past_due',
      reason: `Payment failed: ${invoice.last_payment_error?.message || 'Unknown error'}`,
      changedBy: 'stripe_webhook',
      changedByRole: 'system',
      metadata: {
        invoiceId: invoice.id,
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt
      }
    }
  });

  console.log(`💳 [WEBHOOK] Payment failed for subscription ${stripeSubscriptionId}`);
}

/**
 * Handle customer.subscription.trial_will_end event
 * Called 3 days before trial ends
 *
 * @param {Object} subscription - Stripe Subscription object
 */
export async function handleTrialWillEnd(subscription) {
  const dbSubscription = await prisma.subscriptions.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!dbSubscription) {
    return;
  }

  // Record in history for audit trail
  await prisma.subscription_history.create({
    data: {
      subscriptionId: dbSubscription.id,
      eventType: 'trial_ending',
      reason: 'Trial period ending soon',
      changedBy: 'stripe_webhook',
      changedByRole: 'system',
      metadata: {
        trialEnd: subscription.trial_end
      }
    }
  });

  console.log(`💳 [WEBHOOK] Trial ending soon for subscription ${subscription.id}`);

  // TODO: Send email notification to organization admin
}

/**
 * Main webhook event router
 *
 * @param {Object} event - Stripe Event object
 */
export async function handleWebhookEvent(event) {
  console.log(`💳 [WEBHOOK] Processing event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;

    default:
      console.log(`💳 [WEBHOOK] Unhandled event type: ${event.type}`);
  }
}

export default {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleTrialWillEnd,
  handleWebhookEvent
};
