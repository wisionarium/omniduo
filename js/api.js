// Placeholder client: hoje lê window.OMNIDUO_MOCK, amanhã fetch('/api/...').
// TODO(DB): trocar cada método por fetch quando Supabase/Vercel Postgres entrar.
// TODO(API): POST /api/campaigns, GET /api/inbox, POST /api/webhook-instagram.
window.OmniAPI = {
  async stats() { return window.OMNIDUO_MOCK.stats; },
  async notifications() { return window.OMNIDUO_MOCK.notifications; },
  async campaigns() { return window.OMNIDUO_MOCK.campaigns; },
  async inbox() { return window.OMNIDUO_MOCK.inbox; },
  async crm() { return window.OMNIDUO_MOCK.crm; },
  async agenda() { return window.OMNIDUO_MOCK.agenda; }
};
