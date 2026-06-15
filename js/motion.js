/* Micro-interacciones y animaciones al navegar */
const MotionModule = (() => {
  const REDUCED = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stagger(parent, selector) {
    if (!parent || REDUCED()) return;
    const items = parent.matches?.(selector)
      ? [parent]
      : [...parent.querySelectorAll(selector)];
    items.forEach((el, i) => {
      el.classList.remove('motion-enter');
      el.style.removeProperty('--motion-delay');
      void el.offsetWidth;
      el.style.setProperty('--motion-delay', `${Math.min(i * 40, 360)}ms`);
      el.classList.add('motion-enter');
    });
  }

  function animateView(viewEl) {
    if (!viewEl || REDUCED()) return;

    stagger(viewEl, '.kpi-grid > *');
    stagger(viewEl, '.stats-grid > *');
    stagger(viewEl, '.pathology-grid > .pathology-card');
    stagger(viewEl, '.pathology-priority > .pathology-fold');
    stagger(viewEl, '.trimestral-grid > *');
    stagger(viewEl, '.role-grid > *');
    stagger(viewEl, '.quick-grid > *');

    const tbody = viewEl.querySelector('tbody');
    if (tbody) {
      [...tbody.querySelectorAll('tr')].forEach((row, i) => {
        row.style.setProperty('--motion-delay', `${Math.min(i * 25, 300)}ms`);
      });
    }
  }

  function onViewChange(view) {
    const viewEl = document.getElementById('view-' + view);
    if (!viewEl) return;
    requestAnimationFrame(() => animateView(viewEl));
  }

  function bindNavFeedback() {
    document.querySelectorAll('.nav-item[data-view], .admin-subnav__btn[data-view], .quick-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (REDUCED()) return;
        btn.classList.add('nav-item--pulse');
        window.setTimeout(() => btn.classList.remove('nav-item--pulse'), 280);
      });
    });
  }

  function bindModalMotion() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      if (overlay.id === 'loginOverlay') return;
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  }

  function flashValue(el) {
    if (!el || REDUCED()) return;
    el.style.transform = 'scale(1.08)';
    window.setTimeout(() => { el.style.transform = ''; }, 200);
  }

  function init() {
    bindNavFeedback();
    bindModalMotion();
    const active = document.querySelector('.view.active');
    if (active) requestAnimationFrame(() => animateView(active));
  }

  return { init, onViewChange, flashValue };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof MotionModule !== 'undefined') MotionModule.init();
});
