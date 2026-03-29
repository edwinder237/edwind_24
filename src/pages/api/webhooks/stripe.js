import { buffer } from 'micro';
import { createHandler } from '../../../lib/api/createHandler';
import { constructWebhookEvent } from '../../../lib/stripe/stripeService.js';
import { handleWebhookEvent } from '../../../lib/stripe/webhookHandlers.js';

// Disable Next.js body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false
  }
};

export default createHandler({
  scope: 'public',
  POST: async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('[WEBHOOK] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;

    try {
      const rawBody = await buffer(req);
      event = constructWebhookEvent(rawBody, signature);
    } catch (error) {
      console.error('[WEBHOOK] Signature verification failed:', error.message);
      return res.status(400).json({
        error: 'Webhook signature verification failed',
        message: error.message
      });
    }

    // Acknowledge receipt immediately
    res.status(200).json({ received: true, eventId: event.id });

    // Process the event asynchronously
    try {
      await handleWebhookEvent(event);
    } catch (error) {
      console.error('[WEBHOOK] Error processing event:', error);
    }
  }
});
