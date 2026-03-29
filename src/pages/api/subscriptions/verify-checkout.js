import { createHandler } from '../../../lib/api/createHandler';
import { getStripe, getPlanFromPriceId } from '../../../lib/stripe/stripeService.js';
import { invalidateSubscriptionCache } from '../../../lib/features/subscriptionService.js';
import prisma from '../../../lib/prisma.js';

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
      return res.redirect('/projects');
    }

    try {
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription']
      });

      if (session.status !== 'complete') {
        return res.redirect('/checkout-required');
      }

      const organizationId = session.metadata?.organizationId;
      const stripeSubscription = session.subscription;
      const stripeCustomerId = session.customer;

      if (!organizationId || !stripeSubscription) {
        console.error('[VERIFY] Missing organizationId or subscription in session');
        return res.redirect('/projects?welcome=pro&checkout=success');
      }

      const stripeSubscriptionId = typeof stripeSubscription === 'string'
        ? stripeSubscription
        : stripeSubscription.id;

      const sub = typeof stripeSubscription === 'string'
        ? await stripe.subscriptions.retrieve(stripeSubscription)
        : stripeSubscription;

      const item = sub.items.data[0];
      const priceId = item?.price?.id;
      const plan = await getPlanFromPriceId(priceId);

      const periodStart = sub.current_period_start ?? item?.current_period_start;
      const periodEnd = sub.current_period_end ?? item?.current_period_end;
      const currentPeriodStart = periodStart ? new Date(periodStart * 1000) : new Date();
      const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.subscriptions.upsert({
        where: { organizationId },
        create: {
          organizationId,
          stripeCustomerId,
          stripeSubscriptionId,
          stripeProductId: item?.price?.product,
          stripePriceId: priceId,
          planId: plan?.planId || 'professional',
          status: sub.status,
          currentPeriodStart,
          currentPeriodEnd,
          trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null
        },
        update: {
          stripeCustomerId,
          stripeSubscriptionId,
          stripeProductId: item?.price?.product,
          stripePriceId: priceId,
          planId: plan?.planId || 'professional',
          status: sub.status,
          currentPeriodStart,
          currentPeriodEnd,
          trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null
        }
      });

      invalidateSubscriptionCache(organizationId);

      const resolvedPlanId = plan?.planId || 'essential';
      return res.redirect(`/projects?welcome=${resolvedPlanId}&checkout=success`);

    } catch (error) {
      console.error('[VERIFY] Error verifying checkout:', error.message);
      return res.redirect('/projects?checkout=success');
    }
  }
});
