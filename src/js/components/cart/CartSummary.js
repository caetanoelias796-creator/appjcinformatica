/**
 * PizzaFlow — CartSummary Component
 * Bloco de resumo financeiro do carrinho.
 */

import { formatCurrency } from '@utils/formatters.js';
import { CartStore } from '@/core/CartStore.js';

/**
 * Cria o resumo financeiro do carrinho
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function CartSummary() {
  let element = null;

  function build() {
    element = document.createElement('div');
    element.className = 'cart-summary-container';
    render();
    return element;
  }

  function render() {
    if (!element) return;

    const subtotal = CartStore.subtotal();
    const extras = CartStore.extras();
    const shipping = CartStore.shipping();
    const discount = CartStore.discount();
    const total = CartStore.total();

    element.innerHTML = `
      <h3 class="shipping-title">Resumo do Pedido</h3>
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      ${extras > 0 ? `
        <div class="cart-summary-row">
          <span>Adicionais (Bordas/Extras)</span>
          <span style="color: var(--color-success);">+${formatCurrency(extras)}</span>
        </div>
      ` : ''}
      <div class="cart-summary-row">
        <span>Taxa de Entrega</span>
        <span>${shipping > 0 ? formatCurrency(shipping) : 'Grátis'}</span>
      </div>
      ${discount > 0 ? `
        <div class="cart-summary-row">
          <span>Desconto</span>
          <span style="color: var(--color-success); font-weight: var(--weight-semibold);">-${formatCurrency(discount)}</span>
        </div>
      ` : ''}
      <div class="cart-summary-row total">
        <span>Total</span>
        <span>${formatCurrency(total)}</span>
      </div>
    `;
  }

  function update() {
    render();
  }

  return { build, update };
}
