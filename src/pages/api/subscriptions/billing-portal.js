/**
 * ============================================
 * POST /api/subscriptions/billing-portal
 * ============================================
 *
 * Creates a Stripe Customer Portal session.
 * Allows customers to manage their subscription, payment methods, and invoices.
 *
 * Response:
 * {
 *   success: true,
 *   url: 'https://billing.stripe.com/...'
 * }
 */

import { createHandler } from '../../../lib/api/createHandler';
import { createBillingPortalSession, getOrCreateCustomer } from '../../../lib/stripe/stripeService.js';
import prisma from '../../../lib/prisma.js';

export default createHandler({
  scope: 'admin',
  skipSubscriptionCheck: true,
  POST: async (req, res) => {
    const { orgContext } = req;

  // Check if organization has a Stripe customer
  let subscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: { id: true, stripeCustomerId: true }
  });

  let customerId = subscription?.stripeCustomerId;

  // If no Stripe customer exists, create one
  if (!customerId) {
    // Create Stripe customer (function handles finding org details and admin email)
    const customer = await getOrCreateCustomer(orgContext.organizationId);
    customerId = customer.id;
  }

  // Build return URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 8081}`;
  const returnUrl = `${baseUrl}/organization-settings`;

    // Create billing portal session
    const session = await createBillingPortalSession({
      organizationId: orgContext.organizationId,
      returnUrl,
      customerId
    });

    return res.status(200).json({
      success: true,
      url: session.url
    });
  }
});
