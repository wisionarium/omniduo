// /api/webhook-meta — endpoint de Webhooks da Meta (app OmniDuo Messaging).
// GET: verificação do Facebook (hub.challenge). Requer WEBHOOK_VERIFY_TOKEN.
// POST: valida X-Hub-Signature-256 com o app secret e grava o evento bruto
// em webhook_events. O processamento (QUERO->DM) entra na próxima etapa.
const crypto = require('crypto');
const { supaHeaders, supaUrl } = require('./_session');

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validSignature(raw, header, secret) {
  if (!header || !secret) return false;
  const [algo, hash] = String(header).split('=');
  if (algo !== 'sha256' || !hash) return false;
  const want = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  try {
    if (hash.length !== want.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(want));
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const q = req.query || {};
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(q['hub.challenge'] || '');
      return;
    }
    res.status(403).json({ ok: false, error: 'verify_failed' });
    return;
  }

  if (method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  try {
    const raw = await readRaw(req);
    const header = req.headers['x-hub-signature-256'];
    const secrets = [
      process.env.META_IG_APP_SECRET,
      process.env.META_MSG_APP_SECRET,
      process.env.META_APP_SECRET,
    ].filter(Boolean);
    if (!secrets.some((s) => validSignature(raw, header, s))) {
      res.status(401).json({ ok: false, error: 'bad_signature' });
      return;
    }
    let payload = null;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      res.status(400).json({ ok: false, error: 'bad_json' });
      return;
    }

    const eventType =
      (payload.object || 'meta') +
      ':' +
      (((payload.entry || [])[0] || {}).changes || []).map((c) => c.field).join(',').slice(0, 120);

    await fetch(`${supaUrl()}/rest/v1/webhook_events`, {
      method: 'POST',
      headers: { ...supaHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ source: 'meta', event_type: eventType, payload, processed: false }),
    }).catch(() => {});

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'webhook_failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
};
