/**
 * GET /api/subscriptions/verify-checkout?session_id=cs_xxx
 *
 * Verifies a Stripe checkout session completed successfully,
 * syncs the subscription to the database, and redirects to the app.
 * This handles the case where the webhook hasn't fired yet.
 */

import { getStripe, getPlanFromPriceId } from '../../../lib/stripe/stripeService.js';
import { invalidateSubscriptionCache } from '../../../lib/features/subscriptionService.js';
import prisma from '../../../lib/prisma.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.redirect('/projects');
  }

  try {
    const stripe = getStripe();

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription']
    });

    if (session.status !== 'complete') {
      console.log(`💳 [VERIFY] Checkout session ${session_id} not complete: ${session.status}`);
      return res.redirect('/checkout-required');
    }

    const organizationId = session.metadata?.organizationId;
    const stripeSubscription = session.subscription;
    const stripeCustomerId = session.customer;

    if (!organizationId || !stripeSubscription) {
      console.error('💳 [VERIFY] Missing organizationId or subscription in session');
      return res.redirect('/projects?welcome=pro&checkout=success');
    }

    const stripeSubscriptionId = typeof stripeSubscription === 'string'
      ? stripeSubscription
      : stripeSubscription.id;

    // Get subscription details
    const sub = typeof stripeSubscription === 'string'
      ? await stripe.subscriptions.retrieve(stripeSubscription)
      : stripeSubscription;

    const priceId = sub.items.data[0]?.price?.id;
    const plan = await getPlanFromPriceId(priceId);

    // Upsert subscription in database
    await prisma.subscriptions.upsert({
      where: { organizationId },
      create: {
        organizationId,
        stripeCustomerId,
        stripeSubscriptionId,
        stripeProductId: sub.items.data[0]?.price?.product,
        stripePriceId: priceId,
        planId: plan?.planId || 'professional',
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null
      },
      update: {
        stripeCustomerId,
        stripeSubscriptionId,
        stripeProductId: sub.items.data[0]?.price?.product,
        stripePriceId: priceId,
        planId: plan?.planId || 'professional',
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null
      }
    });

    // Invalidate subscription cache
    invalidateSubscriptionCache(organizationId);

    console.log(`💳 [VERIFY] Synced subscription for org ${organizationId} (${sub.status})`);

    // Redirect to projects
    return res.redirect('/projects?welcome=pro&checkout=success');

  } catch (error) {
    console.error('💳 [VERIFY] Error verifying checkout:', error.message);
    // Fall through to projects with success flag — webhook will eventually sync
    return res.redirect('/projects?welcome=pro&checkout=success');
  }
}
