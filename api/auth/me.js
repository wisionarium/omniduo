// GET /api/auth/me — quem tá logado (lê cookie omn_session + linha do Supabase).
const { parseCookies, verifySession, supaHeaders, supaUrl } = require('../_session');

module.exports = async (req, res) => {
  const ref = verifySession(parseCookies(req).omn_session);
  if (!ref || (!ref.startsWith('fb:') && !ref.startsWith('ig:'))) {
    res.status(200).json({ ok: true, logged: false });
    return;
  }
  const kind = ref.slice(0, 2);
  const id = ref.slice(3);
  const col = kind === 'ig' ? 'ig_id' : 'fb_user_id';
  try {
    const r = await fetch(
      `${supaUrl()}/rest/v1/meta_connections?${col}=eq.${encodeURIComponent(id)}&select=fb_user_id,page_id,ig_id,webhook_subscribed,token_expires_at,scopes`,
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
