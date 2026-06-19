/* Módulos opcionales — cambiar a true para volver a mostrar en el panel */
const US3Features = {
  /** Licencias y vacaciones (js/licencias*.js + #view-licencias en panel.html) */
  licencias: false,
};

function isFeatureEnabled(key) {
  return US3Features[key] !== false;
}

function applyFeatureFlags() {
  if (typeof US3Features === 'undefined') return;
  document.querySelectorAll('[data-feature]').forEach(el => {
    if (US3Features[el.dataset.feature] === false) {
      el.classList.add('feature-hidden');
    } else {
      el.classList.remove('feature-hidden');
    }
  });
}
