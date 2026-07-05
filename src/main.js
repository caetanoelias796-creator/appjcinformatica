/**
 * PizzaFlow — Main Entry Point v2
 */

// Serviços & Router
import { initRouter }           from './js/router/router.js';
import { registerServiceWorker, setupInstallPrompt, setupOfflineDetection } from './js/services/pwa.js';

// Componentes globais
import { mountBottomNav }    from './js/components/BottomNav.js';
import { mountFloatingCart } from './js/components/FloatingCart.js';
import { Header }            from './js/components/Header.js';
import { mountSearchBar }    from './js/components/SearchBar.js';
import { initAddressModal }  from './js/components/AddressModal.js';

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */

async function initApp() {
  console.info('🍕 PizzaFlow — Iniciando v2...');

  // 1. Header
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    const header = Header();
    header.mount(mainContent);
  }

  // 2. Bottom Navigation
  const bottomNavEl = document.getElementById('bottom-nav');
  if (bottomNavEl) mountBottomNav(bottomNavEl);

  // 3. Floating Cart
  const floatingCartEl = document.getElementById('floating-cart');
  if (floatingCartEl) mountFloatingCart(floatingCartEl);

  // 4. Search Overlay
  const searchOverlayEl = document.getElementById('search-overlay');
  if (searchOverlayEl) mountSearchBar(searchOverlayEl);

  // 5. Address Modal
  const addressModalEl = document.getElementById('address-modal');
  if (addressModalEl) initAddressModal(addressModalEl);

  // 6. Router
  initRouter();

  // 7. PWA
  await registerServiceWorker();
  setupInstallPrompt();
  setupOfflineDetection();

  // 8. Splash screen
  hideSplashScreen();

  console.info('🍕 PizzaFlow v2 — Pronto!');
}

/* ==========================================================================
   SPLASH SCREEN
   ========================================================================== */

function hideSplashScreen() {
  const splash  = document.getElementById('splash-screen');
  if (!splash) return;

  const MIN_MS  = 1800;
  const start   = performance.now();

  const hide = () => {
    const delay = Math.max(0, MIN_MS - (performance.now() - start));
    setTimeout(() => {
      splash.classList.add('hidden');
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }, delay);
  };

  hide();
}

/* ==========================================================================
   INIT
   ========================================================================== */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

document.addEventListener('touchstart', () => {}, { passive: true });
