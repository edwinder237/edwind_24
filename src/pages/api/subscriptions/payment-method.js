/**
 * ============================================
 * GET /api/subscriptions/payment-method
 * ============================================
 *
 * Returns the current payment method for the organization's subscription.
 * Fetches card details from Stripe Customer.
 *
 * PROTECTED: Admin-only access via withAdminScope middleware
 */

import { withAdminScope } from '../../../lib/middleware/withOrgScope.js';
import { asyncHandler } from '../../../lib/errors/index.js';
import { getStripe } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orgContext } = req;
  const stripe = getStripe();

  // Get subscription to find Stripe customer ID and subscription ID
  const dbSubscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true }
  });

  if (!dbSubscription?.stripeCustomerId) {
    return res.status(200).json({
      paymentMethod: null,
      message: 'No payment method on file'
    });
  }

  try {
    let paymentMethod = null;
    let paymentMethodId = null;

    // First, try to get payment method from the Stripe subscription
    if (dbSubscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.stripeSubscriptionId);
        paymentMethodId = stripeSubscription.default_payment_method;
      } catch (subErr) {
        console.log('Could not retrieve subscription:', subErr.message);
      }
    }

    // If no payment method on subscription, check the customer
    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(dbSubscription.stripeCustomerId);

      if (customer.deleted) {
        return res.status(200).json({
          paymentMethod: null,
          message: 'Customer not found'
        });
      }

      paymentMethodId = customer.invoice_settings?.default_payment_method || customer.default_source;
    }

    // Retrieve the payment method details
    if (paymentMethodId) {
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

        if (pm.type === 'card' && pm.card) {
          paymentMethod = {
            id: pm.id,
            type: 'card',
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
            funding: pm.card.funding
          };
        }
      } catch (pmErr) {
        // If paymentMethods.retrieve fails, it might be an old-style source
        console.log('Trying to retrieve as source:', pmErr.message);
        try {
          const source = await stripe.customers.retrieveSource(
            dbSubscription.stripeCustomerId,
            paymentMethodId
          );

          if (source.object === 'card') {
            paymentMethod = {
              id: source.id,
              type: 'card',
              brand: source.brand,
              last4: source.last4,
              expMonth: source.exp_month,
              expYear: source.exp_year,
              funding: source.funding
            };
          }
        } catch (srcErr) {
          console.log('Could not retrieve source:', srcErr.message);
        }
      }
    }

    return res.status(200).json({
      paymentMethod,
      message: paymentMethod ? 'Payment method found' : 'No payment method on file'
    });
  } catch (err) {
    console.error('Error fetching payment method:', err);
    return res.status(200).json({
      paymentMethod: null,
      message: 'Could not retrieve payment method'
    });
  }
}

export default withAdminScope(asyncHandler(handler));
