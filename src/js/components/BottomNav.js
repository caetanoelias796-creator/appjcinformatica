/**
 * PizzaFlow — Bottom Navigation v2
 * Com aba #catalog, badge de carrinho e animação de ícone.
 */

import { store, onPageChange, onCartChange } from '@store/store.js';
import { navigate } from '@router/router.js';
import { addRipple } from '@utils/helpers.js';
import { openCartDrawer } from '@components/cart/CartDrawer.js';

/* ==========================================================================
   ABAS
   ========================================================================== */

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Início',
    route: '#home',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    id: 'catalog',
    label: 'Cardápio',
    route: '#catalog',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  },
  {
    id: 'cart',
    label: 'Carrinho',
    route: '#cart',
    hasCartBadge: true,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  },
  {
    id: 'orders',
    label: 'Pedidos',
    route: '#orders',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  },
];

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

export function mountBottomNav(container) {
  let { currentPage, cart } = store.getState();

  // Render inicial
  renderNav(container, currentPage, cart.count);

  // Ripple nos itens
  container.querySelectorAll('.bottom-nav-item').forEach(item => addRipple(item));

  // Eventos de clique
  container.addEventListener('click', handleNavClick);

  // Assina mudanças de página → atualiza aba ativa
  const unsubPage = onPageChange((newPage) => {
    currentPage = newPage;
    updateActive(container, newPage);
  });

  // Assina mudanças do carrinho → atualiza badge
  const unsubCart = onCartChange((newCart) => {
    updateCartBadge(container, newCart.count);
  });

  return {
    destroy() {
      container.removeEventListener('click', handleNavClick);
      unsubPage();
      unsubCart();
    },
  };
}

/* ==========================================================================
   RENDER
   ========================================================================== */

function renderNav(container, activePage, cartCount) {
  container.innerHTML = NAV_ITEMS.map(item => {
    const isActive = item.id === activePage;
    const badge    = item.hasCartBadge && cartCount > 0
      ? `<span class="cart-badge">${cartCount > 9 ? '9+' : cartCount}</span>`
      : '';

    return `
      <button
        class="bottom-nav-item ${isActive ? 'active' : ''}"
        data-nav-id="${item.id}"
        data-nav-route="${item.route}"
        aria-label="${item.label}${item.hasCartBadge && cartCount > 0 ? ` — ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}` : ''}"
        aria-current="${isActive ? 'page' : 'false'}"
        type="button"
      >
        <span class="bottom-nav-indicator" aria-hidden="true"></span>
        <span class="bottom-nav-icon" style="position:relative;">
          ${item.icon}
          ${badge}
        </span>
        <span class="bottom-nav-label">${item.label}</span>
      </button>
    `;
  }).join('');
}

/* ==========================================================================
   HANDLERS
   ========================================================================== */

function handleNavClick(e) {
  const item = e.target.closest('.bottom-nav-item');
  if (!item) return;
  if (item.dataset.navId === 'cart') {
    openCartDrawer();
  } else {
    navigate(item.dataset.navRoute);
  }
}

/* ==========================================================================
   UPDATES PARCIAIS (sem re-render completo)
   ========================================================================== */

function updateActive(container, activePage) {
  container.querySelectorAll('.bottom-nav-item').forEach(item => {
    const isActive = item.dataset.navId === activePage;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function updateCartBadge(container, count) {
  const cartItem = container.querySelector('[data-nav-id="cart"] .bottom-nav-icon');
  if (!cartItem) return;

  // Remove badge anterior
  cartItem.querySelector('.cart-badge')?.remove();

  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'cart-badge';
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.classList.add('anim-bounce-in');
    cartItem.appendChild(badge);

    // Atualiza aria-label
    const btn = container.querySelector('[data-nav-id="cart"]');
    if (btn) btn.setAttribute('aria-label', `Carrinho — ${count} ${count === 1 ? 'item' : 'itens'}`);
  }
}
