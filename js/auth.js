/* Autenticación US3 — un solo ingreso desde index.html */
const US3Auth = (() => {
  const PORTAL_AUTH_KEY = 'us3_portal_auth';
  const PORTAL_USER_KEY = 'us3_portal_user';
  const AUTH_ROLE_KEY = 'us3_auth_role';
  const AUTH_USER_KEY = 'us3_auth_user';
  const AUTH_KEY = 'us3_auth_session';

  const ROLES = {
    admin: 'admin',
    trim_pat: 'trim_pat',
    pat_only: 'pat_only',
    lab_only: 'lab_only',
    readonly: 'readonly',
  };

  const USERS = {
    genaro: { password: 'Cpznk92too', displayName: 'Genaro', role: ROLES.admin },
    diego: { password: '358432', displayName: 'Diego', role: ROLES.trim_pat },
    agostina: { password: '665645', displayName: 'Agostina', role: ROLES.pat_only },
    german: { password: '349096', displayName: 'German', role: ROLES.lab_only },
    sanidad: { password: 'us3*', displayName: 'Sanidad', role: ROLES.readonly },
  };

  const ROLE_LABELS = {
    admin: 'Administrador',
    trim_pat: 'Trimestrales y patologías',
    pat_only: 'Patologías',
    lab_only: 'Laboratorios',
    readonly: 'Solo lectura',
  };

  function normalizeUser(value) {
    return String(value || '').trim().toLowerCase();
  }

  function authenticate(username, password) {
    const key = normalizeUser(username);
    const account = USERS[key];
    if (!account || account.password !== password) return null;
    return { username: key, displayName: account.displayName, role: account.role };
  }

  function establishSession(account) {
    sessionStorage.setItem(PORTAL_AUTH_KEY, 'true');
    sessionStorage.setItem(PORTAL_USER_KEY, account.username);
    sessionStorage.setItem(AUTH_ROLE_KEY, account.role);
    sessionStorage.setItem(AUTH_USER_KEY, account.displayName);
    sessionStorage.setItem(AUTH_KEY, account.role === ROLES.admin ? 'true' : 'false');
  }

  function clearSession() {
    sessionStorage.removeItem(PORTAL_AUTH_KEY);
    sessionStorage.removeItem(PORTAL_USER_KEY);
    sessionStorage.removeItem(AUTH_ROLE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  }

  function isLoggedIn() {
    return sessionStorage.getItem(PORTAL_AUTH_KEY) === 'true'
      && !!sessionStorage.getItem(AUTH_ROLE_KEY);
  }

  function getRole() {
    return sessionStorage.getItem(AUTH_ROLE_KEY) || null;
  }

  function getDisplayName() {
    return sessionStorage.getItem(AUTH_USER_KEY) || 'Usuario';
  }

  function getUsername() {
    return sessionStorage.getItem(PORTAL_USER_KEY) || '';
  }

  function isAdmin() {
    return getRole() === ROLES.admin;
  }

  function canEditPatologias() {
    const role = getRole();
    return role === ROLES.admin || role === ROLES.trim_pat || role === ROLES.pat_only;
  }

  function canEditTrimestral() {
    const role = getRole();
    return role === ROLES.admin || role === ROLES.trim_pat;
  }

  function canEditAdminModules() {
    return isAdmin();
  }

  function canEditLaboratorios() {
    const role = getRole();
    return role === ROLES.admin || role === ROLES.lab_only;
  }

  function sessionLabel() {
    if (!isLoggedIn()) return 'Sin sesión';
    const name = getDisplayName();
    const role = ROLE_LABELS[getRole()] || '';
    return role ? `${name} · ${role}` : name;
  }

  return {
    PORTAL_AUTH_KEY,
    AUTH_ROLE_KEY,
    ROLES,
    ROLE_LABELS,
    authenticate,
    establishSession,
    clearSession,
    isLoggedIn,
    getRole,
    getDisplayName,
    getUsername,
    isAdmin,
    canEditPatologias,
    canEditTrimestral,
    canEditLaboratorios,
    canEditAdminModules,
    sessionLabel,
  };
})();
