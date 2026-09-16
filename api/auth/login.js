// GET /api/auth/login — inicia o OAuth (Facebook Login for Business).
// Escopos mínimos de leitura; messaging (manage_comments/messages) entra na Fase 3.
const crypto = require('crypto');
const { setCookie } = require('../_session');

// App de Login consumidor: só permissões básicas. Escopos de Pages/Instagram
// (pages_show_list, instagram_basic etc.) pertencem ao app de messaging (Fase 4),
// que usa Facebook Login for Business em app separado.
const SCOPES = ['public_profile', 'email'].join(',');

module.exports = (req, res) => {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    res.status(500).json({ ok: false, error: 'missing_meta_config', detail: 'META_APP_ID ausente na Vercel' });
    return;
  }
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  const appUrl = (process.env.APP_URL || (host ? `https://${host}` : '')).replace(/\/$/, '');
  if (!appUrl) {
    res.status(500).json({ ok: false, error: 'missing_app_url', detail: 'APP_URL ausente na Vercel' });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  setCookie(res, 'omn_state', state, { maxAge: 600 });
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/callback`);
  const url =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${redirectUri}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;
  res.writeHead(302, { Location: url });
  res.end();
};
