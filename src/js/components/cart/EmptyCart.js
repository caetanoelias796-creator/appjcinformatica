/**
 * PizzaFlow — EmptyCart Component
 * Estado vazio do carrinho.
 */

/**
 * Cria o componente do carrinho vazio
 * @param {object} options
 * @param {Function} options.onClose - Callback para fechar o carrinho/continuar comprando
 * @returns {{ el: HTMLElement }}
 */
export function EmptyCart({ onClose }) {
  let element = null;

  function build() {
    element = document.createElement('div');
    element.className = 'empty-cart-container';
    element.innerHTML = `
      <div class="empty-cart-illustration" aria-hidden="true">🛒</div>
      <h3 class="empty-cart-title">Seu carrinho está vazio</h3>
      <p class="empty-cart-desc">Adicione uma deliciosa pizza ou bebida para começar a montar o seu pedido.</p>
      <button class="btn btn-outline-primary" id="continue-shopping-btn" type="button" style="border-radius: var(--radius-xl); padding: var(--space-3) var(--space-6);">
        Continuar Comprando
      </button>
    `;

    setupEvents();
    return element;
  }

  function setupEvents() {
    element.querySelector('#continue-shopping-btn')?.addEventListener('click', () => {
      onClose();
    });
  }

  return { build };
}
