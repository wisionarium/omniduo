// GET /api/auth/callback-msg — conclui o Instagram Business Login.
// Fluxo: code -> short token (POST api.instagram.com) -> long-lived
// (GET graph.instagram.com) -> perfil -> upsert por ig_id.
const { parseCookies, setCookie, clearCookie, signSession, supaHeaders, supaUrl } = require('../_session');

const MSG_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
];

module.exports = async (req, res) => {
  try {
    const { code, state } = req.query || {};
    const cookies = parseCookies(req);
    if (!code || !state || cookies.omn_state !== state || !String(state).startsWith('msg-')) {
      res.status(400).json({ ok: false, error: 'bad_state', detail: 'state inválido ou callback sem code' });
      return;
    }
    const appId = process.env.META_IG_APP_ID;
    const appSecret = process.env.META_IG_APP_SECRET;
    if (!appId || !appSecret) throw new Error('missing META_IG_APP_ID/META_IG_APP_SECRET');

    const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
    const appUrl = (process.env.APP_URL || (host ? `https://${host}` : '')).replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/callback-msg`;

    // 1. code -> short-lived token (~1h)
    const ex = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });
    const short = await ex.json().catch(() => ({}));
    if (!ex.ok || short.error_message || !short.access_token) {
      throw new Error(short.error_message || `instagram_exchange ${ex.status}`);
    }

    // 2. short -> long-lived (~60 dias)
    const lq = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: appSecret,
      access_token: short.access_token,
    });
    const lr = await fetch(`https://graph.instagram.com/access_token?${lq}`);
    const long = await lr.json().catch(() => ({}));
    if (!lr.ok || long.error || !long.access_token) {
      throw new Error((long.error && long.error.message) || `instagram_longlived ${lr.status}`);
    }
    const token = long.access_token;
    const expiresAt = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000).toISOString()
      : null;

    // 3. perfil do IG profissional
    const pq = new URLSearchParams({ fields: 'id,username,account_type', access_token: token });
    const pr = await fetch(`https://graph.instagram.com/v21.0/me?${pq}`);
    const profile = await pr.json().catch(() => ({}));
    if (!pr.ok || profile.error || !profile.id) {
      throw new Error((profile.error && profile.error.message) || `instagram_me ${pr.status}`);
    }

    // 4. upsert por ig_id (Business Login não retorna fb_user_id)
    const row = {
      user_id: null,
      fb_user_id: null,
      page_id: null,
      ig_id: String(profile.id),
      access_token_encrypted: token,
      token_expires_at: expiresAt,
      scopes: MSG_SCOPES,
      updated_at: new Date().toISOString(),
    };
    const r = await fetch(`${supaUrl()}/rest/v1/meta_connections?on_conflict=ig_id`, {
      method: 'POST',
      headers: { ...supaHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`supabase_upsert ${r.status}: ${t.slice(0, 200)}`);
    }

    clearCookie(res, 'omn_state');
    setCookie(res, 'omn_session', signSession(`ig:${profile.id}`));
    res.writeHead(302, { Location: `${appUrl}/#/inbox` });
    res.end();
  } catch (e) {
    res.status(500).json({ ok: false, error: 'oauth_ig_failed', detail: String((e && e.message) || e).slice(0, 300) });
  }
};
