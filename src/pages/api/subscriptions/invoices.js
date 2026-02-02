/**
 * ============================================
 * GET /api/subscriptions/invoices
 * ============================================
 *
 * Returns the list of invoices for the organization from Stripe.
 * Includes invoice details and PDF download URLs.
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

  // Get subscription to find Stripe customer ID
  const subscription = await prisma.subscriptions.findUnique({
    where: { organizationId: orgContext.organizationId },
    select: { stripeCustomerId: true }
  });

  if (!subscription?.stripeCustomerId) {
    return res.status(200).json({
      invoices: [],
      message: 'No billing history found'
    });
  }

  try {
    // Fetch invoices from Stripe
    const stripeInvoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 100, // Get up to 100 invoices
      expand: ['data.subscription']
    });

    // Map to simplified format
    const invoices = stripeInvoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      description: invoice.lines?.data?.[0]?.description || 'Subscription',
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      created: new Date(invoice.created * 1000).toISOString(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      planName: invoice.lines?.data?.[0]?.plan?.nickname ||
                invoice.lines?.data?.[0]?.price?.nickname ||
                'Subscription'
    }));

    return res.status(200).json({
      invoices,
      hasMore: stripeInvoices.has_more,
      message: invoices.length > 0 ? 'Invoices found' : 'No invoices found'
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return res.status(500).json({
      invoices: [],
      message: 'Could not retrieve invoices'
    });
  }
}

export default withAdminScope(asyncHandler(handler));
