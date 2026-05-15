import express from 'express';
import crypto from 'crypto';
import db from '../db/index.js';

const router = express.Router();
const ALLOWED_EVENTS = new Set(['item/created', 'item/updated', 'item/deleted', 'item/error', 'item/waiting_user_input']);

const safeEquals = (a = '', b = '') => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

router.post('/', async (req, res) => {
  const configuredSecret = process.env.PLUGGY_WEBHOOK_SECRET || process.env.OPENFINANCE_WEBHOOK_SECRET;
  const providedSecret = req.get('x-openfinance-webhook-secret');
  const timestampHeader = req.get('x-openfinance-webhook-timestamp');
  console.log('WEBHOOK DEBUG', {
  configuredSecret,
  providedSecret,
  timestampHeader,
});

  if (!configuredSecret || !providedSecret || !safeEquals(providedSecret, configuredSecret)) {
    return res.status(401).json({ error: 'Webhook não autorizado' });
  }

  const timestamp = Number(timestampHeader);
  const maxAgeSeconds = Number(process.env.PLUGGY_WEBHOOK_MAX_AGE_SECONDS || process.env.OPENFINANCE_WEBHOOK_MAX_AGE_SECONDS || 300);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > maxAgeSeconds * 1000) {
    return res.status(401).json({ error: 'Webhook expirado ou sem timestamp válido' });
  }

  const { itemId, status, event } = req.body || {};
  if (!itemId || !event || !ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Payload de webhook inválido' });
  }

  const idempotencyKey = req.get('x-idempotency-key') || `${event}:${itemId}:${timestamp}`;

  try {
    await db.query(
      `INSERT INTO openfinance_webhook_events (idempotency_key, event, item_id, status, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [idempotencyKey, event, itemId, status || null, JSON.stringify(req.body)]
    );

    const connection = await db.query(
      'SELECT userId FROM openfinance_connections WHERE connection_token = $1 AND disconnected_at IS NULL',
      [itemId]
    );

    if (connection.rows.length > 0 && status) {
      await db.query(
        'UPDATE openfinance_connections SET status = $1 WHERE connection_token = $2',
        [status, itemId]
      );

      if (event === 'item/updated' && status === 'UPDATED') {
        await db.query(
          'INSERT INTO openfinance_sync_history (userId, contas_sincronizadas, transacoes_sincronizadas, cartoes_sincronizados, status) VALUES ($1, $2, $3, $4, $5)',
          [connection.rows[0].userid || connection.rows[0].userId, 0, 0, 0, 'sucesso']
        );
      }
    }

    return res.json({ message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar webhook Open Finance:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;
