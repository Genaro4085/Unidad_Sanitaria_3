/* US3 — PWA: registro SW, instalación, actualizaciones, offline */
const PWAModule = (() => {
  let deferredPrompt = null;
  let swRegistration = null;
  let waitingWorker = null;

  const SEL = {
    install: '#pwaInstallBanner',
    installBtn: '#pwaInstallBtn',
    installDismiss: '#pwaInstallDismiss',
    offline: '#pwaOfflineBanner',
    update: '#pwaUpdateBanner',
    updateBtn: '#pwaUpdateBtn',
  };

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
      || document.referrer.includes('android-app://');
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function qs(sel) {
    return document.querySelector(sel);
  }

  function show(el) {
    if (el) el.classList.remove('hidden');
  }

  function hide(el) {
    if (el) el.classList.add('hidden');
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);

    return navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        swRegistration = reg;
        listenForUpdates(reg);
        if (reg.waiting) onWaitingWorker(reg.waiting);
        return reg;
      })
      .catch(err => console.warn('[PWA] SW no registrado:', err.message));
  }

  function listenForUpdates(reg) {
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          onWaitingWorker(reg.waiting || worker);
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('us3_pwa_reloading') === '1') {
        sessionStorage.removeItem('us3_pwa_reloading');
        window.location.reload();
      }
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_ACTIVATED' && event.data.buildId) {
        console.info('[PWA] Service Worker activo:', event.data.buildId);
      }
    });

    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }

  function onWaitingWorker(worker) {
    waitingWorker = worker;
    show(qs(SEL.update));
  }

  function applyUpdate() {
    if (!waitingWorker && swRegistration?.waiting) waitingWorker = swRegistration.waiting;
    if (!waitingWorker) {
      window.location.reload();
      return;
    }
    sessionStorage.setItem('us3_pwa_reloading', '1');
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => window.location.reload(), 1500);
  }

  function bindInstallUI() {
    const banner = qs(SEL.install);
    const btn = qs(SEL.installBtn);
    const dismiss = qs(SEL.installDismiss);
    const updateBtn = qs(SEL.updateBtn);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!isStandalone() && !localStorage.getItem('us3_pwa_install_dismissed')) {
        show(banner);
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      hide(banner);
      localStorage.removeItem('us3_pwa_install_dismissed');
      if (typeof showToast === 'function') showToast('Aplicación instalada correctamente', 'success');
    });

    btn?.addEventListener('click', async () => {
      if (!deferredPrompt) {
        if (isIOS()) {
          if (typeof showToast === 'function') {
            showToast('En iPhone/iPad: Compartir → Agregar a pantalla de inicio', 'info', 8000);
          }
        }
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      hide(banner);
      if (outcome === 'dismissed') localStorage.setItem('us3_pwa_install_dismissed', '1');
    });

    dismiss?.addEventListener('click', () => {
      hide(banner);
      localStorage.setItem('us3_pwa_install_dismissed', '1');
    });

    updateBtn?.addEventListener('click', applyUpdate);

    if (isStandalone()) hide(banner);

    if (isIOS() && !isStandalone() && !localStorage.getItem('us3_pwa_install_dismissed')) {
      setTimeout(() => show(banner), 2000);
      const iosHint = qs('#pwaInstallIosHint');
      if (iosHint) iosHint.classList.remove('hidden');
    }
  }

  function bindOfflineUI() {
    const banner = qs(SEL.offline);
    if (!banner) return;

    const sync = () => {
      if (navigator.onLine) hide(banner);
      else show(banner);
    };

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
  }

  function init() {
    document.documentElement.classList.toggle('pwa-standalone', isStandalone());
    registerServiceWorker();
    bindInstallUI();
    bindOfflineUI();
  }

  return { init, isStandalone, applyUpdate };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PWAModule.init());
} else {
  PWAModule.init();
}
