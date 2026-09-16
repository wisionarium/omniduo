// GET /api/auth/login-msg — OAuth do app OmniDuo Messaging (Facebook Login for Business).
// Escopos de Instagram messaging; concedidos em modo dev pelo admin.
const crypto = require('crypto');
const { setCookie } = require('../_session');

const SCOPES = [
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_messaging',
].join(',');

module.exports = (req, res) => {
  const appId = process.env.META_MSG_APP_ID;
  if (!appId) {
    res.status(500).json({ ok: false, error: 'missing_meta_msg_config', detail: 'META_MSG_APP_ID ausente na Vercel' });
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
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${redirectUri}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;
  res.writeHead(302, { Location: url });
  res.end();
};
