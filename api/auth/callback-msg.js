// GET /api/auth/callback-msg — OAuth do app OmniDuo Messaging.
// Troca code por token longa duração e atualiza a MESMA linha do meta_connections
// (upsert por fb_user_id), agora com page_id/ig_id + token de messaging.
const { parseCookies, setCookie, clearCookie, signSession, supaHeaders, supaUrl } = require('../_session');

const MSG_SCOPES = [
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_messaging',
];

async function fbGet(path, params) {
  const q = new URLSearchParams(params);
  const r = await fetch(`https://graph.facebook.com/v21.0${path}?${q}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) {
    const e = new Error(data?.error?.message || `facebook_error ${r.status}`);
    e.fb = data.error;
    throw e;
  }
  return data;
}

module.exports = async (req, res) => {
  try {
    const { code, state } = req.query || {};
    const cookies = parseCookies(req);
    if (!code || !state || cookies.omn_state !== state || !String(state).startsWith('msg-')) {
      res.status(400).json({ ok: false, error: 'bad_state', detail: 'state inválido ou callback sem code' });
      return;
    }
    const appId = process.env.META_MSG_APP_ID;
    const appSecret = process.env.META_MSG_APP_SECRET;
    if (!appId || !appSecret) throw new Error('missing META_MSG_APP_ID/META_MSG_APP_SECRET');

    const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
    const appUrl = (process.env.APP_URL || (host ? `https://${host}` : '')).replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/callback-msg`;

    const short = await fbGet('/oauth/access_token', {
      client_id: appId, redirect_uri: redirectUri, client_secret: appSecret, code,
    });
    const long = await fbGet('/oauth/access_token', {
      grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret,
      fb_exchange_token: short.access_token,
    });
    const token = long.access_token;
    const expiresAt = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000).toISOString()
      : null;

    const me = await fbGet('/me', { fields: 'id,name', access_token: token });
    let pageId = null, igId = null;
    const accs = await fbGet('/me/accounts', {
      fields: 'id,name,instagram_business_account{id,username}', access_token: token,
    });
    const pg = (accs.data || []).find((p) => p.instagram_business_account) || (accs.data || [])[0] || null;
    if (pg) {
      pageId = pg.id;
      if (pg.instagram_business_account) igId = pg.instagram_business_account.id;
    }

    const row = {
      user_id: null,
      fb_user_id: me.id,
      page_id: pageId,
      ig_id: igId,
      access_token_encrypted: token,
      token_expires_at: expiresAt,
      scopes: MSG_SCOPES,
      updated_at: new Date().toISOString(),
    };
    const r = await fetch(`${supaUrl()}/rest/v1/meta_connections?on_conflict=fb_user_id`, {
      method: 'POST',
      headers: { ...supaHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`supabase_upsert ${r.status}: ${t.slice(0, 200)}`);
    }

    clearCookie(res, 'omn_state');
    setCookie(res, 'omn_session', signSession(`fb:${me.id}`));
    res.writeHead(302, { Location: `${appUrl}/#/inbox` });
    res.end();
  } catch (e) {
    res.status(500).json({ ok: false, error: 'oauth_msg_failed', detail: String((e && e.message) || e).slice(0, 300) });
  }
};
