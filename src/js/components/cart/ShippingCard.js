/**
 * PizzaFlow — ShippingCard Component
 * Opções de envio/método de recebimento (Entrega, Retirada, Balcão).
 */

import { CartStore } from '@/core/CartStore.js';
import { SHIPPING_METHODS } from '@/domain/cart/Shipping.js';

/**
 * Cria a seleção de método de recebimento
 * @param {object} options
 * @param {Function} options.onChanged - Callback disparado ao alterar o frete
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function ShippingCard({ onChanged }) {
  let element = null;

  function build() {
    element = document.createElement('div');
    element.className = 'shipping-card-container';
    render();
    return element;
  }

  function render() {
    if (!element) return;

    const currentMethod = CartStore.getShipping().getMethod();

    element.innerHTML = `
      <h3 class="shipping-title">Forma de Entrega</h3>
      <div class="shipping-options" role="radiogroup" aria-label="Opções de recebimento">
        <button 
          class="shipping-option-btn ${currentMethod === SHIPPING_METHODS.DELIVERY ? 'active' : ''}" 
          data-method="${SHIPPING_METHODS.DELIVERY}"
          role="radio"
          aria-checked="${currentMethod === SHIPPING_METHODS.DELIVERY}"
          type="button"
        >
          <span class="shipping-option-icon">🛵</span>
          <span class="shipping-option-label">Entrega</span>
        </button>
        
        <button 
          class="shipping-option-btn ${currentMethod === SHIPPING_METHODS.PICKUP ? 'active' : ''}" 
          data-method="${SHIPPING_METHODS.PICKUP}"
          role="radio"
          aria-checked="${currentMethod === SHIPPING_METHODS.PICKUP}"
          type="button"
        >
          <span class="shipping-option-icon">🛍️</span>
          <span class="shipping-option-label">Retirada</span>
        </button>

        <button 
          class="shipping-option-btn ${currentMethod === SHIPPING_METHODS.DINE_IN ? 'active' : ''}" 
          data-method="${SHIPPING_METHODS.DINE_IN}"
          role="radio"
          aria-checked="${currentMethod === SHIPPING_METHODS.DINE_IN}"
          type="button"
        >
          <span class="shipping-option-icon">🍽️</span>
          <span class="shipping-option-label">Balcão</span>
        </button>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    const buttons = element.querySelectorAll('.shipping-option-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        CartStore.setShippingMethod(method);
        if (onChanged) onChanged();
      });
    });
  }

  function update() {
    render();
  }

  return { build, update };
}
