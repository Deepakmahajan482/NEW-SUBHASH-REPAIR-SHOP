import express from 'express';

const router = express.Router();

/**
 * @desc    Meta WhatsApp Webhook Verification (GET)
 * @route   GET /api/webhook/whatsapp
 * Meta calls this endpoint with hub.mode, hub.verify_token, and hub.challenge
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'subhash_whatsapp_verify_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Meta WhatsApp Webhook verified successfully!');
    return res.status(200).send(challenge);
  }

  console.warn('❌ Meta WhatsApp Webhook verification failed. Token mismatch.');
  return res.sendStatus(403);
});

/**
 * @desc    Meta WhatsApp Event Receiver (POST)
 * @route   POST /api/webhook/whatsapp
 * Meta delivers status updates (sent, delivered, read) and incoming customer messages here
 */
router.post('/whatsapp', (req, res) => {
  const body = req.body;

  if (body?.object === 'whatsapp_business_account') {
    // Log incoming event (delivery status or message)
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.statuses) {
      const status = value.statuses[0];
      console.log(`📨 WhatsApp Message Status: ID=${status.id}, Status=${status.status}, Recipient=${status.recipient_id}`);
    } else if (value?.messages) {
      const message = value.messages[0];
      console.log(`💬 Incoming WhatsApp Message from ${message.from}: ${message.text?.body || message.type}`);
    }

    // Must return HTTP 200 within 20 seconds so Meta doesn't retry
    return res.status(200).send('EVENT_RECEIVED');
  }

  res.sendStatus(404);
});

export default router;
