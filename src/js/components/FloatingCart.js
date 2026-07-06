/**
 * PizzaFlow — Floating Cart Button Component
 * Botão flutuante que mostra quantidade e total do carrinho.
 * Aparece quando há itens no carrinho.
 */

import { navigate } from '@router/router.js';
import { formatCurrency } from '@utils/formatters.js';
import { EventBus } from '@/core/EventBus.js';
import { CartStore } from '@/core/CartStore.js';

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

/**
 * Monta o botão flutuante do carrinho
 * @param {HTMLElement} container
 */
export function mountFloatingCart(container) {
  // Renderiza estado inicial
  render(container, {
    items: CartStore.getItems(),
    count: CartStore.getItemCount(),
    total: CartStore.getTotal()
  });

  // Assina mudanças do carrinho via EventBus
  const unsubscribe = EventBus.subscribe('cart:update', (items) => {
    render(container, {
      items,
      count: CartStore.getItemCount(),
      total: CartStore.getTotal()
    });
  });

  // Evento de navegação
  container.addEventListener('click', (e) => {
    if (e.target.closest('.floating-cart-btn')) {
      navigate('#cart');
    }
  });

  return {
    destroy() {
      unsubscribe();
    },
  };
}

/* ==========================================================================
   RENDER
   ========================================================================== */

/**
 * Renderiza ou atualiza o botão do carrinho
 * @param {HTMLElement} container
 * @param {{ items: any[], count: number, total: number }} cart
 */
function render(container, cart) {
  const isEmpty = cart.count === 0;

  if (isEmpty) {
    // Esconde se não há itens
    container.innerHTML = '';
    return;
  }

  const totalFormatted = formatCurrency(cart.total);
  const itemsLabel = cart.count === 1 ? '1 item' : `${cart.count} itens`;

  container.innerHTML = `
    <button
      class="floating-cart-btn ripple-container"
      aria-label="Ver carrinho — ${itemsLabel} — ${totalFormatted}"
      id="floating-cart-btn"
      type="button"
    >
      <!-- Ícone do carrinho -->
      <span class="floating-cart-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </span>

      <!-- Informações -->
      <span class="floating-cart-info">
        <span class="floating-cart-count">${itemsLabel}</span>
        <span class="floating-cart-total">${totalFormatted}</span>
      </span>

      <!-- Seta -->
      <span class="floating-cart-arrow" aria-hidden="true">›</span>
    </button>
  `;

  // Adiciona ripple no botão
  const btn = container.querySelector('.floating-cart-btn');
  if (btn) {
    setupRipple(btn);
  }
}

/* ==========================================================================
   RIPPLE MANUAL (leve, sem import circular)
   ========================================================================== */

/**
 * Adiciona efeito ripple a um botão
 * @param {HTMLElement} el
 */
function setupRipple(el) {
  el.addEventListener('pointerdown', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x - size/2}px; top:${y - size/2}px;
    `;
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }, { passive: true });
}
