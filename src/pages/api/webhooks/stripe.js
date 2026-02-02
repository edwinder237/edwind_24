/**
 * ============================================
 * POST /api/webhooks/stripe
 * ============================================
 *
 * Handles Stripe webhook events.
 * NO AUTHENTICATION - Uses Stripe signature verification.
 *
 * Events handled:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 * - customer.subscription.trial_will_end
 */

import { buffer } from 'micro';
import { constructWebhookEvent } from '../../../lib/stripe/stripeService.js';
import { handleWebhookEvent } from '../../../lib/stripe/webhookHandlers.js';

// Disable Next.js body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the signature from headers
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    console.error('💳 [WEBHOOK] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);

    // Verify signature and construct event
    event = constructWebhookEvent(rawBody, signature);
  } catch (error) {
    console.error('💳 [WEBHOOK] Signature verification failed:', error.message);
    return res.status(400).json({
      error: 'Webhook signature verification failed',
      message: error.message
    });
  }

  // Acknowledge receipt immediately
  // Process asynchronously to avoid timeout
  res.status(200).json({ received: true, eventId: event.id });

  // Process the event asynchronously
  try {
    await handleWebhookEvent(event);
  } catch (error) {
    // Log but don't fail - we already returned 200
    console.error('💳 [WEBHOOK] Error processing event:', error);
  }
}
