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
  requestAnimationFrame(() => moveNotch(document.querySelector('.dock-items button.on')));
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

// liquid dock com notch deslizante (img2 + img3): so transform/opacity
const notch = document.getElementById('notchClosed');
const dockBtns = Array.from(document.querySelectorAll('.dock-items button'));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function moveNotch(btn) {
  if (!btn || !notch) return;
  if (reduceMotion) { notch.style.transition = 'none'; }
  const dock = btn.parentElement.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  const x = r.left - dock.left + r.width / 2 - 30;
  notch.style.transform = `translateX(${x}px)`;
  const svg = btn.querySelector('svg');
  if (svg) notch.innerHTML = svg.outerHTML;
}
dockBtns.forEach((b) => {
  b.addEventListener('click', () => {
    dockBtns.forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
    b.classList.add('on');
    b.setAttribute('aria-selected', 'true');
    moveNotch(b);
  });
});
addEventListener('resize', () => moveNotch(document.querySelector('.dock-items button.on')));

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
