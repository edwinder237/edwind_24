import prisma from '../../../lib/prisma';
import Stripe from 'stripe';
import { createHandler } from '../../../lib/api/createHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FALLBACK_PRICES = {
  essential: 29.95,
  professional: 49.95
};

const FEATURE_DISPLAY = {
  essential: [
    { text: 'Up to 5 projects', included: true },
    { text: 'Up to 100 participants', included: true },
    { text: 'Basic reporting', included: true },
    { text: '1 sub-organization', included: true },
    { text: 'Up to 3 instructors', included: true },
    { text: 'Advanced analytics', included: false },
    { text: 'Timeline view', included: false },
    { text: 'Bulk participant import', included: false }
  ],
  professional: [
    { text: 'Up to 50 projects', included: true },
    { text: 'Up to 500 participants', included: true },
    { text: 'Advanced analytics & Kirkpatrick', included: true },
    { text: '10 sub-organizations', included: true },
    { text: 'Up to 20 instructors', included: true },
    { text: 'Timeline view', included: true },
    { text: 'Bulk participant import', included: true },
    { text: 'Custom assessments & roles', included: true }
  ]
};

export default createHandler({
  scope: 'public',
  GET: async (req, res) => {
    const dbPlans = await prisma.subscription_plans.findMany({
      where: { isActive: true, isPublic: true, planId: { not: 'enterprise' } },
      orderBy: { displayOrder: 'asc' },
      select: {
        planId: true,
        name: true,
        description: true,
        trialDays: true,
        features: true,
        resourceLimits: true,
        stripePriceId: true,
        highlightText: true
      }
    });

    const plans = await Promise.all(
      dbPlans.map(async (plan) => {
        let monthlyPrice = 0;
        let currency = 'USD';

        if (plan.stripePriceId) {
          try {
            const stripePrice = await stripe.prices.retrieve(plan.stripePriceId);
            monthlyPrice = stripePrice.unit_amount / 100;
            currency = stripePrice.currency.toUpperCase();
          } catch (err) {
            console.error(`Failed to fetch Stripe price for ${plan.planId}:`, err.message);
          }
        }

        if (monthlyPrice === 0 && FALLBACK_PRICES[plan.planId]) {
          monthlyPrice = FALLBACK_PRICES[plan.planId];
        }

        let features = FEATURE_DISPLAY[plan.planId] || [];
        if (Array.isArray(plan.features) && plan.features.length > 0 && plan.features[0]?.text) {
          features = plan.features;
        }

        const hasTrial = plan.trialDays > 0;

        return {
          id: plan.planId,
          name: plan.name,
          price: `$${monthlyPrice}`,
          period: '/mo',
          description: plan.description || '',
          buttonText: hasTrial ? `Start ${plan.trialDays}-Day Free Trial` : `Get ${plan.name}`,
          buttonVariant: plan.planId === 'professional' ? 'contained' : 'outlined',
          popular: !!plan.highlightText,
          highlightText: plan.highlightText || null,
          features,
          currency
        };
      })
    );

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ plans });
  }
});
