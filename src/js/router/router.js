/**
 * PizzaFlow — Router v2
 * Adiciona rota #catalog.
 */

import { store } from '@store/store.js';
import { qs }    from '@utils/helpers.js';

/* ==========================================================================
   ROTAS
   ========================================================================== */

const routes = {
  '#home':             () => import('@pages/HomePage.js'),
  '#catalog':          () => import('@pages/CatalogPage.js'),
  '#cart':             () => import('@pages/CartPage.js'),
  '#checkout':         () => import('@pages/CheckoutPage.js'),
  '#product':          () => import('@pages/ProductPage.js'),
  '#orders':           () => import('@pages/OrderPage.js'),
  '#profile':          () => import('@pages/OrderPage.js'),
  '#admin-products':        () => import('@pages/AdminProductsPage.js'),
  '#admin-categories':      () => import('@pages/AdminCategoriesPage.js'),
  '#admin-flavors':         () => import('@pages/AdminFlavorsPage.js'),
  '#admin-product-builder': () => import('@pages/AdminProductBuilderPage.js'),
  '#admin-dashboard':       () => import('@pages/AdminDashboardPage.js'),
};

const DEFAULT_ROUTE = '#home';

/* ==========================================================================
   ESTADO
   ========================================================================== */

let currentPageDestroy = null;

/* ==========================================================================
   NAVEGAÇÃO
   ========================================================================== */

export function navigate(hash, options = {}) {
  if (options.replace) {
    history.replaceState(null, '', hash);
  } else {
    history.pushState(null, '', hash);
  }
  handleRoute();
}

export function navigateToProduct(productId) {
  store.dispatch('SET_PRODUCT', productId);
  navigate('#product');
}

export function back() {
  history.back();
}

/* ==========================================================================
   HANDLER
   ========================================================================== */

async function handleRoute() {
  const hash        = window.location.hash || DEFAULT_ROUTE;
  const mainContent = qs('#main-content');

  if (!mainContent) return;

  // Cleanup da página anterior
  if (currentPageDestroy) {
    try { currentPageDestroy(); } catch {}
    currentPageDestroy = null;
  }

  // Encontra rota
  const routeKey    = Object.keys(routes).find(r => hash.startsWith(r));
  const routeLoader = routes[routeKey] ?? routes[DEFAULT_ROUTE];
  const pageName    = (routeKey ?? DEFAULT_ROUTE).replace('#', '');

  store.dispatch('SET_PAGE', pageName);

  // Animação saída
  mainContent.classList.remove('page-enter');
  mainContent.classList.add('page-exit');

  try {
    const pageModule  = await routeLoader();
    const PageFactory = pageModule.default;

    if (!PageFactory) throw new Error(`Página sem export default: ${routeKey}`);

    await new Promise(resolve => setTimeout(resolve, 80));

    mainContent.innerHTML = '';

    const page = PageFactory();
    const { destroy } = await page.mount(mainContent);
    currentPageDestroy = destroy;

    mainContent.classList.remove('page-exit');
    mainContent.classList.add('page-enter');

    window.scrollTo({ top: 0, behavior: 'instant' });

  } catch (error) {
    console.error('[Router]', error);
    mainContent.innerHTML = renderErrorPage(error.message);
    mainContent.classList.remove('page-exit');
    mainContent.classList.add('page-enter');
  }
}

/* ==========================================================================
   ERROR PAGE
   ========================================================================== */

function renderErrorPage(msg) {
  return `
    <div class="cart-empty" style="min-height:80vh;">
      <div class="cart-empty-icon">😕</div>
      <h2 class="cart-empty-title">Ops! Algo deu errado</h2>
      <p class="cart-empty-desc">${msg || 'Não conseguimos carregar essa página.'}</p>
      <button class="btn btn-primary mt-6" onclick="window.location.hash='#home'" id="error-home-btn">
        Voltar ao início
      </button>
    </div>
  `;
}

/* ==========================================================================
   INIT
   ========================================================================== */

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);

  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = DEFAULT_ROUTE;
  } else {
    handleRoute();
  }

  console.info('[Router] Iniciado. Rota:', window.location.hash);
}
