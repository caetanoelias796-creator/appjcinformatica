/**
 * PizzaFlow — CartItemCard Component
 * Card individual de exibição e controle de item no carrinho.
 */

import { formatCurrency } from '@utils/formatters.js';
import { CartStore } from '@/core/CartStore.js';

/**
 * Cria o card de item do carrinho
 * @param {object} options
 * @param {object} options.item - Objeto CartItem
 * @returns {{ el: HTMLElement }}
 */
export function CartItemCard({ item }) {
  let element = null;

  function build() {
    element = document.createElement('div');
    element.className = 'cart-item-card';
    element.id = `cart-item-${item.id}`;
    element.setAttribute('aria-label', `${item.productName} — ${formatCurrency(item.totalPrice)}`);

    render();
    setupEvents();
    return element;
  }

  function render() {
    if (!element) return;

    // Constrói descrição dos detalhes
    const details = [];
    if (item.size) details.push(`Tamanho: ${item.size.label}`);
    if (item.flavors && item.flavors.length > 1) {
      details.push(`Sabores: ${item.flavors.map(f => f.name).join(' / ')}`);
    }
    if (item.crust && item.crust.id !== 'sem-borda') {
      details.push(`Borda: ${item.crust.name}`);
    }
    if (item.extras && item.extras.length > 0) {
      details.push(`Extras: ${item.extras.map(e => e.name).join(', ')}`);
    }
    if (item.observation) {
      details.push(`<span style="color: var(--color-primary); font-style: italic;">"${item.observation}"</span>`);
    }

    element.innerHTML = `
      <div class="cart-item-image-wrapper">
        <img class="cart-item-image" src="${item.image || '/icons/icon-192.png'}" alt="${item.productName}" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-header">
          <h4 class="cart-item-name">${item.productName}</h4>
          <button class="cart-item-remove-btn" data-action="remove" aria-label="Remover ${item.productName} do carrinho" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        
        <div class="cart-item-details">
          ${details.map(d => `<span>${d}</span>`).join('')}
        </div>

        <div class="cart-item-footer">
          <span class="cart-item-price">${formatCurrency(item.totalPrice)}</span>
          <div class="cart-item-qty">
            <button class="cart-item-qty-btn" data-action="decrease" aria-label="Diminuir quantidade" type="button">−</button>
            <span class="cart-item-qty-val" aria-live="polite">${item.quantity}</span>
            <button class="cart-item-qty-btn" data-action="increase" aria-label="Aumentar quantidade" type="button">+</button>
          </div>
        </div>
      </div>
    `;
  }

  function setupEvents() {
    element.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      if (action === 'remove') {
        // Animação de saída
        element.style.transform = 'translateX(50px)';
        element.style.opacity = '0';
        element.addEventListener('transitionend', () => {
          CartStore.removeItem(item.id);
        }, { once: true });
      } else if (action === 'increase') {
        CartStore.updateQuantity(item.id, item.quantity + 1);
      } else if (action === 'decrease') {
        if (item.quantity > 1) {
          CartStore.updateQuantity(item.id, item.quantity - 1);
        } else {
          // Animação de saída se remover por quantidade
          element.style.transform = 'translateX(50px)';
          element.style.opacity = '0';
          element.addEventListener('transitionend', () => {
            CartStore.removeItem(item.id);
          }, { once: true });
        }
      }
    });
  }

  return { build };
}
