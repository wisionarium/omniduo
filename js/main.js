const duo = document.getElementById('duo');
const bC = document.getElementById('btnClosed');
const bO = document.getElementById('btnOpen');
const bN = document.getElementById('btnNight');
const bD = document.getElementById('btnDay');
const authWrap = document.getElementById('authWrap');
const topbar = document.getElementById('topbar');
const stage = document.getElementById('stage');
const hint = document.getElementById('hint');
const form = document.getElementById('loginForm');
const authErr = document.getElementById('authErr');

function setMode(open) {
  duo.classList.toggle('open', open);
  bC.setAttribute('aria-pressed', String(!open));
  bO.setAttribute('aria-pressed', String(open));
}
function setTheme(night) {
  document.documentElement.dataset.theme = night ? 'night' : 'day';
  bN.setAttribute('aria-pressed', String(night));
  bD.setAttribute('aria-pressed', String(!night));
}
function showApp() {
  authWrap.hidden = true;
  authWrap.style.display = 'none';
  topbar.hidden = false;
  stage.hidden = false;
  hint.hidden = false;
  requestAnimationFrame(() => setActiveTab(document.querySelector('.dock-items button.on'), true));
}
bC.onclick = () => setMode(false);
bO.onclick = () => setMode(true);
bN.onclick = () => setTheme(true);
bD.onclick = () => setTheme(false);
document.getElementById('btnLogout').onclick = () => location.reload();
addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea')) return;
  if (e.key === 'f' || e.key === 'F') setMode(!duo.classList.contains('open'));
  if (e.key === 't' || e.key === 'T') setTheme(document.documentElement.dataset.theme !== 'night');
});

// login: minha escolha — tela inicial, valida e libera o Duo
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('pass').value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    authErr.textContent = 'Digite um email válido.';
    return;
  }
  if (pass.length < 4) {
    authErr.textContent = 'Senha mínima de 4 caracteres.';
    return;
  }
  authErr.textContent = '';
  try { sessionStorage.setItem('omniduo_auth', '1'); } catch {}
  showApp();
});
try { if (sessionStorage.getItem('omniduo_auth') === '1') showApp(); } catch {}
document.getElementById('forgot').onclick = (e) => { e.preventDefault(); authErr.textContent = 'Link de recuperação enviado (demo).'; };
document.getElementById('signup').onclick = (e) => { e.preventDefault(); authErr.textContent = 'Cadastro demo — use qualquer email.'; };

// dock: circulo verde DESLIZA de aba em aba (transform), slot concavo acompanha
const dock = document.querySelector('.liquid-dock');
const slider = document.getElementById('dockSlider');
const dockBtns = Array.from(document.querySelectorAll('.dock-items button'));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let sliderX = 0, sliderAnim = null;
function sliderTarget(btn) {
  const dockR = dock.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  return r.left - dockR.left + r.width / 2 - 29;
}
function paintSlider(x) {
  sliderX = x;
  slider.style.transform = `translateX(${x}px)`;
  dock.style.setProperty('--notch-x', `${x + 29}px`);
}
function easeOutBack(t) {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
function setActiveTab(btn, instant = false) {
  dockBtns.forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
  btn.classList.add('on');
  btn.setAttribute('aria-selected', 'true');
  const svg = btn.querySelector('svg');
  if (svg) slider.innerHTML = svg.outerHTML;
  const to = sliderTarget(btn);
  if (instant || reduceMotion) {
    cancelAnimationFrame(sliderAnim);
    paintSlider(to);
    return;
  }
  cancelAnimationFrame(sliderAnim);
  const from = sliderX, t0 = performance.now(), dur = 420;
  slider.style.willChange = 'transform';
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    paintSlider(from + (to - from) * easeOutBack(p));
    if (p < 1) sliderAnim = requestAnimationFrame(step);
    else slider.style.willChange = '';
  };
  sliderAnim = requestAnimationFrame(step);
}
dockBtns.forEach((b) => b.addEventListener('click', () => setActiveTab(b)));
addEventListener('resize', () => setActiveTab(document.querySelector('.dock-items button.on'), true));

// sheet arrastavel: snap meio (0) / expandida (-190), so transform
const sheet = document.getElementById('sheet');
const handle = document.getElementById('sheetHandle');
const SNAP_MIN = -190, SNAP_MAX = 0;
let sheetY = 0;
function setSheet(y, expanded) {
  sheetY = Math.max(SNAP_MIN, Math.min(SNAP_MAX, y));
  sheet.style.transform = `translateY(${sheetY}px)`;
  const open = expanded !== undefined ? expanded : sheetY < -95;
  sheet.classList.toggle('open', open);
  if (handle) handle.setAttribute('aria-valuenow', open ? '1' : '0');
}
if (sheet && handle && !reduceMotion) {
  let startY = 0, baseY = 0, dragging = false;
  handle.addEventListener('pointerdown', (e) => {
    dragging = true; startY = e.clientY; baseY = sheetY;
    handle.setPointerCapture(e.pointerId);
    sheet.style.transition = 'none';
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setSheet(baseY + (e.clientY - startY));
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    setSheet(sheetY);
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); setSheet(SNAP_MIN, true); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSheet(SNAP_MAX, false); }
  });
}

// rail lateral (img1)
const railBtns = Array.from(document.querySelectorAll('.rail button'));
railBtns.forEach((b) => b.addEventListener('click', () => {
  railBtns.forEach((x) => x.classList.remove('on'));
  b.classList.add('on');
}));

// placeholders via OmniAPI (mock agora, /api depois)
(async () => {
  try {
    const api = window.OmniAPI;
    if (!api) return;
    const notifs = await api.notifications();
    const stack = document.getElementById('notifStack');
    if (stack && Array.isArray(notifs)) {
      stack.innerHTML = notifs.map((n) => (
        `<div class="notif"><div class="n-icon">${n.app}</div><div><b>${n.title}</b><span>${n.body}</span></div></div>`
      )).join('');
    }
    const s = await api.stats();
    const statEls = document.querySelectorAll('.stat b');
    if (s && statEls.length >= 3) {
      const fmt = (v) => Number(v).toLocaleString('pt-BR');
      statEls[0].textContent = fmt(s.comments);
      statEls[1].textContent = fmt(s.dms);
      statEls[2].textContent = fmt(s.leads);
    }
  } catch {}
})();
