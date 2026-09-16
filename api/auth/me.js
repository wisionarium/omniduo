// GET /api/auth/me — quem tá logado (lê cookie omn_session + linha do Supabase).
const { parseCookies, verifySession, supaHeaders, supaUrl } = require('../_session');

module.exports = async (req, res) => {
  const ref = verifySession(parseCookies(req).omn_session);
  if (!ref || !ref.startsWith('fb:')) {
    res.status(200).json({ ok: true, logged: false });
    return;
  }
  const fbId = ref.slice(3);
  try {
    const r = await fetch(
      `${supaUrl()}/rest/v1/meta_connections?fb_user_id=eq.${encodeURIComponent(fbId)}&select=fb_user_id,page_id,ig_id,token_expires_at,scopes`,
      { headers: supaHeaders() }
    );
    const rows = await r.json().catch(() => []);
    const c = Array.isArray(rows) ? rows[0] : null;
    if (!c) {
      res.status(200).json({ ok: true, logged: false });
      return;
    }
    res.status(200).json({ ok: true, logged: true, ...c });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'me_failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
};
