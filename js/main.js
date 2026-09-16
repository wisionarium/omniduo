const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const topbar = $('#topbar');
const authWrap = $('#authWrap');
const layoutLabel = $('#layoutLabel');
const toastEl = $('#toast');
let toastT = null;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { toastEl.hidden = true; }, 2200);
}

/* ---------- tema ---------- */
const bN = $('#btnNight'), bD = $('#btnDay');
function setTheme(night, save = true) {
  document.documentElement.dataset.theme = night ? 'night' : 'day';
  bN.setAttribute('aria-pressed', String(night));
  bD.setAttribute('aria-pressed', String(!night));
  document.querySelector('meta[name="theme-color"]');
  if (save) { try { localStorage.setItem('omniduo_theme', night ? 'night' : 'day'); } catch {} }
}
(function initTheme() {
  let t = null;
  try { t = localStorage.getItem('omniduo_theme'); } catch {}
  if (t) setTheme(t === 'night', false);
  else setTheme(matchMedia('(prefers-color-scheme: light)').matches ? false : true, false);
})();
bN.onclick = () => { setTheme(true); toast('Tema escuro'); };
bD.onclick = () => { setTheme(false); toast('Tema claro'); };

/* ---------- layout fechada/aberta ---------- */
let layoutPref = 'auto';
try { layoutPref = localStorage.getItem('omniduo_layout') || 'auto'; } catch {}
function segments() {
  try { if (window.getWindowSegments) return window.getWindowSegments().length; } catch {}
  return 1;
}
function computeLayout() {
  if (layoutPref === 'closed') return 'closed';
  if (layoutPref === 'open') return 'open';
  if (segments() > 1) return 'open';
  return window.innerWidth >= 700 ? 'open' : 'closed';
}
function applyLayout() {
  const l = computeLayout();
  app.dataset.layout = l;
  document.body.dataset.layout = l;
  layoutLabel.textContent = l === 'open' ? 'Aberta · completo' : 'Fechada · essencial';
  $$('.menu-pop [data-layout-pref]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.layoutPref === layoutPref)));
}
$$('.menu-pop [data-layout-pref]').forEach((b) => {
  b.onclick = () => {
    layoutPref = b.dataset.layoutPref;
    try { localStorage.setItem('omniduo_layout', layoutPref); } catch {}
    applyLayout();
    toast(layoutPref === 'auto' ? 'Exibição: auto' : layoutPref === 'open' ? 'Exibição: aberta' : 'Exibição: fechada');
    document.querySelector('.menu').open = false;
  };
});
addEventListener('resize', applyLayout);
addEventListener('orientationchange', () => setTimeout(applyLayout, 60));
applyLayout();

/* ---------- auth ---------- */
const form = $('#loginForm'), authErr = $('#authErr');
function showApp() {
  authWrap.hidden = true; authWrap.style.display = 'none';
  topbar.hidden = false; app.hidden = false;
  applyLayout();
}
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#email').value.trim();
  const pass = $('#pass').value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { authErr.textContent = 'Digite um email válido.'; return; }
  if (pass.length < 4) { authErr.textContent = 'Senha mínima de 4 caracteres.'; return; }
  authErr.textContent = '';
  try { sessionStorage.setItem('omniduo_auth', '1'); } catch {}
  showApp(); toast('Bem-vindo ao OmniDuo');
});
$('#forgot').onclick = (e) => { e.preventDefault(); authErr.textContent = 'Link de recuperação enviado (demo).'; };
$('#signup').onclick = (e) => { e.preventDefault(); authErr.textContent = 'Cadastro demo — use qualquer email.'; };
$('#btnLogout').onclick = async () => {
  try { await window.OmniAPI.logout(); } catch {}
  try { sessionStorage.removeItem('omniduo_auth'); } catch {}
  location.href = './';
};
try { if (sessionStorage.getItem('omniduo_auth') === '1') showApp(); } catch {}
// Sessão real (Facebook) tem prioridade sobre a demo local.
(async () => {
  try {
    const me = await window.OmniAPI.me();
    if (me && me.logged) showApp();
  } catch { /* offline: mantém mock/demo */ }
})();
addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea')) return;
  if (e.key === 'f' || e.key === 'F') { layoutPref = app.dataset.layout === 'open' ? 'closed' : 'open'; applyLayout(); }
  if (e.key === 't' || e.key === 'T') setTheme(document.documentElement.dataset.theme !== 'night');
});

/* ---------- abas fechada/aberta ---------- */
const TABS = ['campanhas', 'inbox', 'crm', 'agenda'];
let activeTab = 'campanhas';
function setTab(tab, opts = {}) {
  if (!TABS.includes(tab)) return;
  activeTab = tab;
  $$('#closedView .dock button').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  });
  $$('#openView .rail button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  $$('#closedView .panel').forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  if (tab === 'inbox' && app.dataset.layout === 'closed') backToChats();
  if (location.hash !== '#/' + tab && !opts.noHash) history.replaceState(null, '', '#/' + tab);
  if (app.dataset.layout === 'open' && !opts.noScroll) {
    const pane = $('#pane-' + tab);
    if (pane) {
      pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      pane.classList.add('flash');
      setTimeout(() => pane.classList.remove('flash'), 700);
    }
  }
}
$$('#closedView .dock button').forEach((b) => b.onclick = () => setTab(b.dataset.tab));
$$('#openView .rail button').forEach((b) => b.onclick = () => setTab(b.dataset.tab));
(function initHash() {
  const h = (location.hash || '').replace('#/', '');
  if (TABS.includes(h)) setTab(h, { noScroll: true });
})();

/* ---------- dados ---------- */
const state = { stats: { comments: 0, dms: 0, leads: 0 }, campaigns: [], chats: [], crm: { novo: [], zap: [], fechado: [] }, agenda: [], notifs: [] };
const fmt = (v) => Number(v).toLocaleString('pt-BR');

function renderStats() {
  $('#stComments').textContent = fmt(state.stats.comments);
  $('#stDms').textContent = fmt(state.stats.dms);
  $('#stLeads').textContent = fmt(state.stats.leads);
}
function campCard(c) {
  const b = document.createElement('button');
  b.className = 'camp'; b.type = 'button';
  b.innerHTML = `<span class="thumb">${c.thumb}</span><span style="flex:1"><b></b><span></span></span><span class="pill"></span>`;
  b.querySelector('b').textContent = c.title;
  b.querySelector('span span').textContent = c.meta;
  const pill = b.querySelector('.pill');
  const paint = () => {
    const on = c.status === 'ATIVA';
    pill.textContent = c.status;
    pill.classList.toggle('on', on);
    pill.classList.toggle('off', !on);
  };
  paint();
  b.onclick = () => {
    c.status = c.status === 'ATIVA' ? 'PAUSADA' : 'ATIVA';
    paint(); syncCamps(); toast(c.title + ' → ' + c.status);
  };
  return b;
}
function renderCamps() {
  const a = $('#campListClosed'), o = $('#campListOpen');
  a.innerHTML = ''; o.innerHTML = '';
  state.campaigns.forEach((c) => { a.appendChild(campCard(c)); o.appendChild(campCard(c)); });
}
function syncCamps() { renderCamps(); }
function msgEl(m) {
  const d = document.createElement('div');
  d.className = 'msg ' + (m.mine ? 'out' : 'in');
  d.innerHTML = `<small></small><span></span>`;
  d.querySelector('small').textContent = m.from;
  d.querySelector('span').textContent = m.text;
  return d;
}
/* inbox estilo WhatsApp: lista -> conversa */
let activeChatId = null;
function activeChat() {
  return state.chats.find((c) => c.id === activeChatId) || state.chats[0];
}
function lastMsg(c) {
  return c.messages[c.messages.length - 1];
}
function chatRow(c) {
  const b = document.createElement('button');
  b.className = 'chat-row' + (c.id === activeChatId ? ' on' : '');
  b.type = 'button';
  const lm = lastMsg(c);
  b.innerHTML = `<span class="avatar"></span><span class="chat-main"><span class="chat-top"><b></b><i></i></span><span class="chat-sub"><span></span><em></em></span></span>`;
  b.querySelector('.avatar').textContent = c.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  b.querySelector('.chat-top b').textContent = c.name;
  b.querySelector('.chat-top i').textContent = c.time;
  b.querySelector('.chat-sub span').textContent = lm ? ((lm.mine ? 'Você: ' : '') + lm.text) : '';
  const badge = b.querySelector('.chat-sub em');
  if (c.unread > 0) { badge.textContent = c.unread; badge.className = 'unread'; }
  else badge.remove();
  b.onclick = () => openChat(c.id);
  return b;
}
function renderChatLists() {
  const a = $('#chatListClosed'), o = $('#chatListOpen');
  a.innerHTML = ''; o.innerHTML = '';
  state.chats.forEach((c) => { a.appendChild(chatRow(c)); o.appendChild(chatRow(c)); });
  const total = state.chats.reduce((n, c) => n + (c.unread || 0), 0);
  $('#inboxUnreadClosed').textContent = total ? total + ' não lidas' : 'em dia';
}
function renderThread() {
  const c = activeChat();
  if (!c) return;
  const a = $('#threadClosed'), o = $('#threadOpen');
  a.innerHTML = ''; o.innerHTML = '';
  c.messages.forEach((m) => { a.appendChild(msgEl(m)); o.appendChild(msgEl(m)); });
  $('#chatNameClosed').textContent = c.name;
  $('#chatNameOpen').textContent = c.name;
  $('#chatMetaOpen').textContent = c.handle + ' · ' + c.origin;
  a.scrollTop = a.scrollHeight; o.scrollTop = o.scrollHeight;
}
function renderInbox() { renderChatLists(); renderThread(); }
function openChat(id, fromNotif) {
  activeChatId = id;
  const c = activeChat();
  c.unread = 0;
  renderChatLists(); renderThread();
  // fechada: sai da lista e abre a conversa
  if (app.dataset.layout === 'closed' || fromNotif === 'closed') {
    $('#chatListViewClosed').hidden = true;
    $('#chatDetailViewClosed').hidden = false;
  }
}
function backToChats() {
  $('#chatListViewClosed').hidden = false;
  $('#chatDetailViewClosed').hidden = true;
}
$('#chatBackClosed').onclick = backToChats;
function sendMsg(text) {
  if (!text.trim()) return;
  const c = activeChat();
  if (!c) return;
  c.messages.push({ from: 'Você', text: text.trim(), mine: true });
  c.time = 'agora';
  state.stats.dms += 1; renderStats(); renderInbox();
  toast('Resposta enviada p/ ' + c.name);
  setTimeout(() => {
    c.messages.push({ from: c.handle, text: 'Boa! Manda no Zap?' });
    renderInbox(); toast('Nova resposta de ' + c.name);
  }, 1200);
}
$('#composerClosed').addEventListener('submit', (e) => {
  e.preventDefault();
  sendMsg($('#composerInputClosed').value);
  $('#composerInputClosed').value = '';
});
$('#composerOpen').addEventListener('submit', (e) => {
  e.preventDefault();
  sendMsg($('#composerInputOpen').value);
  $('#composerInputOpen').value = '';
});

function leadEl(l, stage) {
  const b = document.createElement('button');
  b.className = 'lead'; b.type = 'button';
  b.innerHTML = `<b></b><small></small><br><span class="stage"></span>`;
  b.querySelector('b').textContent = l.user;
  b.querySelector('small').textContent = l.meta;
  b.querySelector('.stage').textContent = stage.toUpperCase();
  b.onclick = () => advanceLead(l, stage);
  return b;
}
function advanceLead(l, stage) {
  const order = ['novo', 'zap', 'fechado'];
  const i = order.indexOf(stage);
  const from = order[i], to = order[(i + 1) % order.length];
  state.crm[from] = state.crm[from].filter((x) => x !== l);
  state.crm[to].push(l);
  if (to === 'zap') state.stats.leads += 1;
  renderStats(); renderCrm();
  toast(l.user + ': ' + from + ' → ' + to);
}
function renderCrm() {
  const strip = $('#crmStripClosed'); strip.innerHTML = '';
  ['novo', 'zap', 'fechado'].forEach((s) => state.crm[s].forEach((l) => strip.appendChild(leadEl(l, s))));
  const k = $('#kanbanOpen'); k.innerHTML = '';
  [['novo', 'Novo'], ['zap', 'Zap'], ['fechado', 'Fechado']].forEach(([key, label]) => {
    const col = document.createElement('div');
    col.className = 'kcol';
    col.innerHTML = `<h4>${label} (${state.crm[key].length})</h4>`;
    state.crm[key].forEach((l) => col.appendChild(leadEl(l, key)));
    k.appendChild(col);
  });
}
const AGENDA_NEXT = { 'Agendado': 'Na fila', 'Na fila': 'Rascunho', 'Rascunho': 'Agendado' };
function schedEl(a) {
  const b = document.createElement('button');
  b.className = 'sched-row'; b.type = 'button';
  b.innerHTML = `<span></span><b></b>`;
  b.querySelector('span').textContent = a.when;
  b.querySelector('b').textContent = a.status;
  b.onclick = () => { a.status = AGENDA_NEXT[a.status] || 'Agendado'; renderAgenda(); toast(a.when + ' → ' + a.status); };
  return b;
}
function renderAgenda() {
  const a = $('#schedClosed'), o = $('#schedOpen');
  a.innerHTML = ''; o.innerHTML = '';
  state.agenda.forEach((x) => { a.appendChild(schedEl(x)); o.appendChild(schedEl(x)); });
}
function renderNotifs() {
  const stack = $('#notifStack'), open = $('#notifOpen');
  stack.innerHTML = ''; open.innerHTML = '';
  const unread = state.notifs.filter((n) => !n.read).length;
  $('#notifCount').textContent = unread ? unread + ' novas' : 'em dia';
  state.notifs.forEach((n) => {
    const b = document.createElement('button');
    b.className = 'notif' + (n.read ? ' read' : '');
    b.type = 'button';
    b.innerHTML = `<span class="n-icon"></span><span><b></b><span></span></span>`;
    b.querySelector('.n-icon').textContent = n.app;
    b.querySelector('b').textContent = n.title;
    b.querySelector('span span').textContent = n.body;
    b.onclick = () => {
      n.read = true; renderNotifs();
      if (n.tab) setTab(n.tab);
      toast(n.title);
    };
    stack.appendChild(b);
    open.appendChild(b.cloneNode(true));
  });
  $$('#notifOpen .notif').forEach((el, i) => {
    el.onclick = () => { state.notifs[i].read = true; renderNotifs(); toast(state.notifs[i].title); };
  });
}

/* hero CTAs */
$('#btnActivate').onclick = () => {
  state.stats.comments += 1; state.stats.dms += 1; renderStats();
  const c = state.campaigns[0];
  if (c) { c.status = 'ATIVA'; syncCamps(); }
  setTab('campanhas', { noHash: true });
  toast('Campanha QUERO ativa — DM enviada');
};
$('#btnSchedule').onclick = () => {
  state.agenda.unshift({ when: 'NOVO — reel QUERO', status: 'Agendado' });
  renderAgenda(); setTab('agenda');
  toast('Reel agendado');
};

/* sheet */
const sheet = $('#sheet'), handle = $('#sheetHandle');
handle.onclick = () => {
  const open = sheet.classList.toggle('open');
  handle.setAttribute('aria-expanded', String(open));
};

/* boot */
(async () => {
  try {
    const api = window.OmniAPI;
    if (!api) return;
    state.stats = await api.stats();
    state.campaigns = await api.campaigns();
    state.chats = await api.inbox();
    activeChatId = state.chats[0] && state.chats[0].id;
    const crm = await api.crm();
    state.crm = { novo: [...crm.novo], zap: [...crm.zap], fechado: [...crm.fechado] };
    state.agenda = await api.agenda();
    const notifs = await api.notifications();
    state.notifs = notifs.map((n, i) => ({ ...n, read: false, tab: ['campanhas', 'inbox', 'crm', 'campanhas'][i % 4] }));
  } catch { /* mantém vazio, ainda testável */ }
  renderStats(); renderCamps(); renderInbox(); renderCrm(); renderAgenda(); renderNotifs();
  setTab(activeTab, { noScroll: true, noHash: true });
})();

/* PWA */
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
