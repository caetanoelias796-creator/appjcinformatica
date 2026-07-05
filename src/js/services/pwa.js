/**
 * PizzaFlow — PWA Service
 * Service Worker registration, install prompt management, offline detection.
 */

import { store } from '@store/store.js';

/* ==========================================================================
   SERVICE WORKER REGISTRATION
   ========================================================================== */

/**
 * Registra o Service Worker se suportado pelo browser
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service Worker não suportado neste browser.');
    return;
  }

  try {
    const base = import.meta.env.BASE_URL || '/';
    const registration = await navigator.serviceWorker.register(`${base}sw.js`, {
      scope: base,
    });

    console.info('[PWA] Service Worker registrado com sucesso:', registration.scope);

    // Verifica atualizações a cada hora
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.info('[PWA] Nova versão disponível!');
          showUpdateNotification(registration);
        }
      });
    });

  } catch (error) {
    console.error('[PWA] Falha ao registrar Service Worker:', error);
  }
}

/* ==========================================================================
   INSTALL PROMPT
   ========================================================================== */

/** Referência ao evento beforeinstallprompt capturado */
let deferredPrompt = null;

/**
 * Configura captura do prompt de instalação PWA
 */
export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;

    // Armazena no store para uso posterior
    store.dispatch('SET_PWA_PROMPT', event);

    // Mostra o banner de instalação customizado após 5 segundos
    setTimeout(() => {
      showInstallBanner();
    }, 5000);
  });

  // Usuário já instalou o app
  window.addEventListener('appinstalled', () => {
    console.info('[PWA] App instalado com sucesso!');
    deferredPrompt = null;
    hideInstallBanner();
  });
}

/**
 * Dispara o prompt nativo de instalação
 * @returns {Promise<boolean>} true se o usuário aceitou
 */
export async function triggerInstallPrompt() {
  if (!deferredPrompt) {
    console.warn('[PWA] Prompt de instalação não disponível');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Verifica se o app está instalado como PWA
 * @returns {boolean}
 */
export function isPWAInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/* ==========================================================================
   INSTALL BANNER (UI)
   ========================================================================== */

/**
 * Renderiza e exibe o banner de instalação customizado
 */
function showInstallBanner() {
  const banner = document.getElementById('pwa-install-prompt');
  if (!banner || isPWAInstalled()) return;

  banner.innerHTML = `
    <div class="pwa-install-icon" aria-hidden="true">🍕</div>
    <div class="pwa-install-info">
      <p class="pwa-install-title">Instalar PizzaFlow</p>
      <p class="pwa-install-desc">Adicione à tela inicial e receba notificações de promoções exclusivas.</p>
    </div>
    <div class="pwa-install-actions">
      <button class="btn btn-primary btn-sm" id="pwa-install-btn" aria-label="Instalar app">
        Instalar
      </button>
      <button class="pwa-install-dismiss" id="pwa-dismiss-btn" aria-label="Fechar">×</button>
    </div>
  `;

  banner.hidden = false;
  banner.classList.add('anim-slide-up');

  // Botão de instalar
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    const accepted = await triggerInstallPrompt();
    if (accepted) hideInstallBanner();
  });

  // Botão de dispensar
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    hideInstallBanner();
  });
}

/**
 * Oculta o banner de instalação
 */
function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-prompt');
  if (banner) {
    banner.hidden = true;
    banner.innerHTML = '';
  }
}

/* ==========================================================================
   OFFLINE DETECTION
   ========================================================================== */

/**
 * Configura detecção de status online/offline
 */
export function setupOfflineDetection() {
  const showOfflineToast = () => {
    // Importa dinamicamente para evitar dependência circular
    import('../components/Toast.js').then(({ showToast }) => {
      showToast({
        type: 'warning',
        title: 'Sem conexão',
        message: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
        duration: 5000,
      });
    }).catch(() => {
      console.warn('[PWA] Sem conexão com a internet');
    });
  };

  const showOnlineToast = () => {
    import('../components/Toast.js').then(({ showToast }) => {
      showToast({
        type: 'success',
        title: 'Conectado!',
        message: 'Sua conexão foi restaurada.',
        duration: 3000,
      });
    }).catch(() => {});
  };

  window.addEventListener('offline', showOfflineToast);
  window.addEventListener('online',  showOnlineToast);

  // Estado inicial
  if (!navigator.onLine) {
    setTimeout(showOfflineToast, 1500);
  }
}

/* ==========================================================================
   UPDATE NOTIFICATION
   ========================================================================== */

/**
 * Notifica o usuário sobre nova versão disponível
 * @param {ServiceWorkerRegistration} registration
 */
function showUpdateNotification(registration) {
  const banner = document.getElementById('pwa-install-prompt');
  if (!banner) return;

  banner.innerHTML = `
    <div class="pwa-install-icon" aria-hidden="true">🔄</div>
    <div class="pwa-install-info">
      <p class="pwa-install-title">Nova versão disponível!</p>
      <p class="pwa-install-desc">Atualize para aproveitar as novidades do PizzaFlow.</p>
    </div>
    <div class="pwa-install-actions">
      <button class="btn btn-primary btn-sm" id="pwa-update-btn">Atualizar</button>
      <button class="pwa-install-dismiss" id="pwa-dismiss-btn">×</button>
    </div>
  `;

  banner.hidden = false;

  document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.hidden = true;
  });
}
