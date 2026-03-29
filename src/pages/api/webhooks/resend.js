import { buffer } from 'micro';
import { Webhook } from 'svix';
import { createHandler } from '../../../lib/api/createHandler';
import prisma from '../../../lib/prisma';

// Disable Next.js body parsing — raw body needed for signature verification
export const config = {
  api: {
    bodyParser: false
  }
};

// Map Resend event types to delivery status values
const STATUS_MAP = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.delivery_delayed': 'delayed',
  'email.complained': 'complained',
  'email.opened': 'opened',
  'email.clicked': 'clicked'
};

// Higher number = more significant (don't overwrite with less significant status)
const STATUS_PRIORITY = {
  bounced: 6,
  complained: 5,
  delivered: 4,
  delayed: 3,
  opened: 2,
  clicked: 1
};

export default createHandler({
  scope: 'public',
  POST: async (req, res) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[RESEND WEBHOOK] Missing RESEND_WEBHOOK_SECRET env var');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event;
    try {
      const rawBody = await buffer(req);
      const headers = {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': req.headers['svix-signature']
      };
      const wh = new Webhook(secret);
      event = wh.verify(rawBody.toString(), headers);
    } catch (error) {
      console.error('[RESEND WEBHOOK] Signature verification failed:', error.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Process event BEFORE responding (Vercel terminates serverless functions after response)
    const eventType = event.type;
    const newStatus = STATUS_MAP[eventType];

    if (newStatus) {
      const resendEmailId = event.data?.email_id;
      if (!resendEmailId) {
        console.warn('[RESEND WEBHOOK] No email_id in payload for event:', eventType);
      } else {
        try {
          const existing = await prisma.email_logs.findFirst({
            where: { resendEmailId },
            select: { id: true, deliveryStatus: true }
          });

          if (existing) {
            const currentPriority = STATUS_PRIORITY[existing.deliveryStatus] || 0;
            const newPriority = STATUS_PRIORITY[newStatus] || 0;

            if (newPriority > currentPriority) {
              await prisma.email_logs.updateMany({
                where: { resendEmailId },
                data: {
                  deliveryStatus: newStatus,
                  deliveryUpdatedAt: new Date()
                }
              });
            }
          }
        } catch (error) {
          console.error('[RESEND WEBHOOK] Error processing event:', error);
        }
      }
    }

    return res.status(200).json({ received: true });
  }
});
