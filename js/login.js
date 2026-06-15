/* ── Acceso al panel — landing / login ── */

const PORTAL_AUTH_KEY = 'us3_portal_auth';
const PORTAL_USER_KEY = 'us3_portal_user';
const PORTAL_USER = 'us3';
const PORTAL_PASS = 'us3';
(function () {
  if (sessionStorage.getItem(PORTAL_AUTH_KEY) === 'true') {
    window.location.replace('panel.html');
    return;
  }

  const form = document.getElementById('portalLoginForm');
  const err = document.getElementById('portalLoginError');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('portalUser').value.trim();
    const pass = document.getElementById('portalPass').value;

    if (user === PORTAL_USER && pass === PORTAL_PASS) {
      sessionStorage.setItem(PORTAL_AUTH_KEY, 'true');
      sessionStorage.setItem(PORTAL_USER_KEY, user);
      window.location.href = 'panel.html';
      return;
    }

    if (err) {
      err.classList.remove('hidden');
    }
    document.getElementById('portalPass').value = '';
    document.getElementById('portalPass').focus();
  });

  document.getElementById('portalPass')?.addEventListener('input', () => err?.classList.add('hidden'));
  document.getElementById('portalUser')?.addEventListener('input', () => err?.classList.add('hidden'));
})();
