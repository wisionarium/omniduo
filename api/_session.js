// Helpers compartilhados das Functions (arquivo com _ não vira rota na Vercel).
const crypto = require('crypto');

function parseCookies(req) {
  const out = {};
  const h = req.headers && req.headers.cookie;
  if (!h) return out;
  h.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i < 0) return;
    out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function setCookie(res, name, value, { maxAge = 60 * 60 * 24 * 30, httpOnly = true } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
    'Secure',
  ];
  if (httpOnly) parts.push('HttpOnly');
  const prev = res.getHeader && res.getHeader('Set-Cookie');
  if (prev) {
    const arr = Array.isArray(prev) ? prev : [prev];
    res.setHeader('Set-Cookie', [...arr, parts.join('; ')]);
  } else {
    res.setHeader('Set-Cookie', parts.join('; '));
  }
}

function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0 });
}

// Sessão opaca: "fb:<fb_user_id>.<hmac>" — sem JWT, sem lib.
function signSession(ref) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('missing SESSION_SECRET');
  const sig = crypto.createHmac('sha256', secret).update(ref).digest('hex');
  return `${ref}.${sig}`;
}

function verifySession(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const ref = token.slice(0, i);
  const sig = token.slice(i + 1);
  const want = crypto.createHmac('sha256', secret).update(ref).digest('hex');
  try {
    if (sig.length !== want.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  } catch {
    return null;
  }
  return ref;
}

function supaHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('missing SUPABASE_SERVICE_ROLE_KEY');
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function supaUrl() {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('missing SUPABASE_URL');
  return url.replace(/\/$/, '');
}

module.exports = { parseCookies, setCookie, clearCookie, signSession, verifySession, supaHeaders, supaUrl };
