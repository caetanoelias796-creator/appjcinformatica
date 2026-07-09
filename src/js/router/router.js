/**
 * PizzaFlow — Router v2
 * Adiciona rota #catalog.
 */

import { store } from '@store/store.js';
import { qs }    from '@utils/helpers.js';
import { AuthService } from '@services/AuthService.js';

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

  // Intercepta rotas administrativas para exigir login com Firebase Auth
  if (hash.startsWith('#admin-')) {
    if (!AuthService.isReady()) {
      mainContent.innerHTML = `
        <div class="cart-empty" style="min-height:80vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div class="splash-loader" role="progressbar" style="margin: 0 auto; width: 40px; height: 4px; background: var(--color-border); position: relative; overflow: hidden;">
            <div class="splash-loader-fill" style="position: absolute; height: 100%; width: 50%; background: var(--color-primary); animation: shimmer 1.5s infinite ease-in-out;"></div>
          </div>
          <p class="cart-empty-desc mt-4" style="color: var(--color-text-secondary); font-size: var(--text-xs);">Verificando sessão...</p>
        </div>
      `;
      const unsubscribe = AuthService.subscribe((user) => {
        unsubscribe();
        handleRoute();
      });
      return;
    }

    if (!AuthService.isAuthenticated()) {
      renderAdminLoginPage(mainContent, hash);
      return;
    }
  }

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

/* ==========================================================================
   TELA DE LOGIN DO ADMINISTRADOR
   ========================================================================== */

function renderAdminLoginPage(container, targetHash) {
  // Oculta elementos de clientes (Bottom Nav e Floating Cart) durante a autenticação
  const bottomNav = document.getElementById('bottom-nav');
  const floatingCart = document.getElementById('floating-cart');
  if (bottomNav) bottomNav.style.display = 'none';
  if (floatingCart) floatingCart.style.display = 'none';

  container.innerHTML = `
    <div class="page" style="display: flex; align-items: center; justify-content: center; min-height: 80vh; padding: var(--space-4); background: #F8FAFC; width: 100%;">
      <div class="card p-6" style="width: 100%; max-width: 400px; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); background: #FFFFFF; border: 1px solid var(--color-border);">
        <div style="text-align: center; margin-bottom: var(--space-5);">
          <span style="font-size: 3rem;">🍕</span>
          <h2 class="font-primary font-bold text-xl mt-2" style="margin: 0; color: var(--color-text-primary); letter-spacing: -0.02em;">PizzaFlow Admin</h2>
          <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 4px;">Painel de Controle da Pizzaria</p>
        </div>
        
        <form id="admin-login-form" style="display: flex; flex-direction: column; gap: var(--space-4);" onsubmit="return false;">
          <div class="input-group">
            <label class="input-label" for="login-email" style="font-size: var(--text-2xs); font-weight: var(--weight-bold); text-transform: uppercase; color: var(--color-text-muted);">E-mail corporativo</label>
            <input class="input" type="email" id="login-email" required placeholder="Ex: admin@pizzaflow.com" style="width: 100%; padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: var(--text-xs);">
          </div>
          
          <div class="input-group">
            <label class="input-label" for="login-password" style="font-size: var(--text-2xs); font-weight: var(--weight-bold); text-transform: uppercase; color: var(--color-text-muted);">Senha de acesso</label>
            <input class="input" type="password" id="login-password" required placeholder="Sua senha" style="width: 100%; padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: var(--text-xs);">
          </div>
          
          <button class="btn btn-primary mt-2" id="login-submit-btn" style="width: 100%; padding: var(--space-3); border-radius: var(--radius-md); font-weight: var(--weight-semibold); background: var(--color-primary); color: #FFFFFF; border: none; cursor: pointer; font-size: var(--text-xs); transition: background var(--transition-fast);">
            Entrar no Painel
          </button>
        </form>

        <div style="margin-top: var(--space-4); padding: var(--space-3); background: #F1F5F9; border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: 11px; text-align: center; color: var(--color-text-secondary); line-height: 1.4;">
          🔑 <strong>Dica de Teste (Mock):</strong><br>
          Use o e-mail: <code style="color: var(--color-primary); font-weight: var(--weight-bold);">admin@pizzaflow.com</code> e a senha: <code style="color: var(--color-primary); font-weight: var(--weight-bold);">admin123</code>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#admin-login-form');
  const btn = container.querySelector('#login-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#login-email').value.trim();
    const password = container.querySelector('#login-password').value;

    btn.disabled = true;
    btn.textContent = 'Autenticando...';
    btn.style.opacity = '0.7';

    try {
      await AuthService.login(email, password);
      
      // Restaura exibição padrão dos componentes de cliente
      if (bottomNav) bottomNav.style.display = '';
      if (floatingCart) floatingCart.style.display = '';
      
      const { toastSuccess } = await import('@components/Toast.js');
      toastSuccess('Bem-vindo!', 'Acesso autorizado.');
      
      // Força recarregamento da rota autorizada
      handleRoute();
    } catch (err) {
      const { toastError } = await import('@components/Toast.js');
      toastError('Erro ao entrar', err.message || 'Credenciais inválidas.');
      btn.disabled = false;
      btn.textContent = 'Entrar no Painel';
      btn.style.opacity = '1';
    }
  });
}
