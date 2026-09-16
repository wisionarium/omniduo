// OmniAPI: tenta o backend (/api/*); se indisponível, cai pro mock local.
// Hoje o backend tem: GET /api/health, /api/auth/me, POST /api/auth/logout.
// Amanhã: GET /api/campaigns, /api/inbox, POST /api/webhook-meta.
async function real(path, opts) {
  const r = await fetch(path, { credentials: 'include', ...(opts || {}) });
  if (!r.ok) throw new Error(`api ${r.status}`);
  return r.json();
}

const mock = (k) => (window.OMNIDUO_MOCK ? window.OMNIDUO_MOCK[k] : null);

window.OmniAPI = {
  async me() {
    try {
      return await real('/api/auth/me');
    } catch {
      return { ok: true, logged: false, offline: true };
    }
  },
  async logout() {
    try {
      await real('/api/auth/logout', { method: 'POST' });
    } catch { /* offline: só limpa local */ }
  },
  async stats() {
    try {
      return await real('/api/stats');
    } catch {
      return mock('stats');
    }
  },
  async notifications() {
    try {
      return await real('/api/notifications');
    } catch {
      return mock('notifications');
    }
  },
  async campaigns() {
    try {
      return await real('/api/campaigns');
    } catch {
      return mock('campaigns');
    }
  },
  async inbox() {
    try {
      return await real('/api/inbox');
    } catch {
      return mock('inbox');
    }
  },
  async crm() {
    try {
      return await real('/api/crm');
    } catch {
      return mock('crm');
    }
  },
  async agenda() {
    try {
      return await real('/api/agenda');
    } catch {
      return mock('agenda');
    }
  },
};
