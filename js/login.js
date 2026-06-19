/* Acceso al panel — login único */
(function () {
  if (US3Auth.isLoggedIn()) {
    window.location.replace('panel.html');
    return;
  }

  const form = document.getElementById('portalLoginForm');
  const err = document.getElementById('portalLoginError');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('portalUser').value.trim();
    const pass = document.getElementById('portalPass').value;
    const account = US3Auth.authenticate(user, pass);

    if (account) {
      US3Auth.establishSession(account);
      window.location.href = 'panel.html';
      return;
    }

    err?.classList.remove('hidden');
    document.getElementById('portalPass').value = '';
    document.getElementById('portalPass').focus();
  });

  document.getElementById('portalPass')?.addEventListener('input', () => err?.classList.add('hidden'));
  document.getElementById('portalUser')?.addEventListener('input', () => err?.classList.add('hidden'));
})();
