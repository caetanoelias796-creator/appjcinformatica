/**
 * PizzaFlow — Quantity Selector Component
 * Controle de quantidade do produto a ser adicionado ao carrinho.
 */

/**
 * Cria o seletor de quantidade
 * @param {object} options
 * @param {Function} options.onChange - Callback executado ao alterar a quantidade
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function QuantitySelector({ onChange }) {
  let element = null;
  let currentQty = 1;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('section');
    element.className = 'product-modal-section quantity-section';
    element.id = 'product-modal-quantity-section';
    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;

    currentQty = state.quantity || 1;

    element.innerHTML = `
      <h3 class="product-modal-section-title" style="margin-bottom: 0;">
        <span>🔢 Quantidade</span>
      </h3>
      <div class="quantity-controller">
        <button 
          class="quantity-controller-btn" 
          id="qty-decrease-btn"
          aria-label="Diminuir quantidade"
          type="button"
          ${currentQty <= 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}
        >−</button>
        <span class="quantity-controller-value" aria-live="polite" aria-atomic="true">${currentQty}</span>
        <button 
          class="quantity-controller-btn" 
          id="qty-increase-btn"
          aria-label="Aumentar quantidade"
          type="button"
        >+</button>
      </div>
    `;

    setupEvents();
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    const decBtn = element.querySelector('#qty-decrease-btn');
    const incBtn = element.querySelector('#qty-increase-btn');

    decBtn?.addEventListener('click', () => {
      if (currentQty > 1) {
        onChange(currentQty - 1);
      }
    });

    incBtn?.addEventListener('click', () => {
      onChange(currentQty + 1);
    });
  }

  return { build, update };
}
