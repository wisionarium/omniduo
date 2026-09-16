// GET /api/auth/login-msg — OAuth do app OmniDuo Messaging via
// Instagram Business Login (instagram_business_*). Host: instagram.com,
// token em api.instagram.com, API em graph.instagram.com.
// Requer envs: META_IG_APP_ID (= ID do app do Instagram), APP_URL.
const crypto = require('crypto');
const { setCookie } = require('../_session');

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
].join(',');

module.exports = (req, res) => {
  const appId = process.env.META_IG_APP_ID;
  if (!appId) {
    res.status(500).json({ ok: false, error: 'missing_ig_config', detail: 'META_IG_APP_ID ausente na Vercel' });
    return;
  }
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  const appUrl = (process.env.APP_URL || (host ? `https://${host}` : '')).replace(/\/$/, '');
  if (!appUrl) {
    res.status(500).json({ ok: false, error: 'missing_app_url', detail: 'APP_URL ausente na Vercel' });
    return;
  }
  const state = 'msg-' + crypto.randomBytes(16).toString('hex');
  setCookie(res, 'omn_state', state, { maxAge: 600 });
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/callback-msg`);
  const url =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${redirectUri}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;
  res.writeHead(302, { Location: url });
  res.end();
};
