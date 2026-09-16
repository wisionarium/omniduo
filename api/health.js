// GET /api/health — prova que a Function enxerga o Supabase.
// Usa REST direto (sem deps) pra ser leve. Requer envs na Vercel:
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ou ANON como fallback de leitura).
module.exports = async (req, res) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ ok: false, error: 'missing_env', detail: 'SUPABASE_URL ou SERVICE_ROLE ausente na Vercel' });
    return;
  }
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const body = await r.text();
    if (!r.ok) {
      res.status(500).json({ ok: false, error: 'supabase_rest_error', status: r.status, detail: body.slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true, supabase: 'reachable', profiles_probe: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'fetch_failed', detail: String(e && e.message || e).slice(0, 300) });
  }
};
