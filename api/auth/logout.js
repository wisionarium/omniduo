// POST /api/auth/logout — limpa a sessão e volta pra home.
const { clearCookie } = require('../_session');

module.exports = (req, res) => {
  clearCookie(res, 'omn_session');
  const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  const appUrl = (process.env.APP_URL || (host ? `https://${host}` : '')).replace(/\/$/, '');
  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    res.writeHead(302, { Location: `${appUrl}/` });
    res.end();
    return;
  }
  res.status(200).json({ ok: true, logged: false });
};
