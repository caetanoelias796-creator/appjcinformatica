import { formatCurrency } from '@utils/formatters.js';
import { EventBus } from '@/core/EventBus.js';
import { PizzaRules } from '@/core/PizzaRules.js';

const EXTRA_INGREDIENTS = [
  { id: 'bacon', name: 'Bacon', price: 4.50 },
  { id: 'catupiry', name: 'Catupiry Extra', price: 5.00 },
  { id: 'cheddar', name: 'Cheddar Extra', price: 5.00 },
  { id: 'azeitona', name: 'Azeitona', price: 3.00 },
  { id: 'tomate', name: 'Tomate', price: 2.00 },
  { id: 'cebola', name: 'Cebola', price: 2.00 },
  { id: 'milho', name: 'Milho', price: 2.50 }
];

/**
 * Cria o seletor de extras
 * @param {object} options
 * @param {Function} options.onAdd - Callback para adicionar extra
 * @param {Function} options.onRemove - Callback para remover extra
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function ExtraSelector({ onAdd, onRemove }) {
  let element = null;
  let currentExtras = [];
  let unsubscribe = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('section');
    element.className = 'product-modal-section';
    element.id = 'product-modal-extras-section';

    // Escuta evento para atualizar automaticamente
    unsubscribe = EventBus.subscribe('product:updated', ({ config }) => {
      update(config);
    });

    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;

    const { extras } = state;
    currentExtras = extras || [];

    element.innerHTML = `
      <div class="product-modal-section-title-wrapper">
        <h3 class="product-modal-section-title">
          <span>🥓 Ingredientes extras</span>
        </h3>
        <span class="product-modal-section-badge">Opcional</span>
      </div>
      <div class="extra-list">
        ${EXTRA_INGREDIENTS.map(item => {
          const isSelected = currentExtras.some(e => e.id === item.id);
          return `
            <div 
              class="extra-item ${isSelected ? 'selected' : ''}" 
              data-extra-id="${item.id}"
              role="checkbox"
              aria-checked="${isSelected}"
              tabindex="0"
            >
              <span class="extra-item-name">${item.name}</span>
              <div class="extra-item-right">
                <span class="extra-item-price">+${formatCurrency(item.price)}</span>
                <div class="extra-item-checkbox">
                  ${isSelected ? `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    setupEvents();
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    const items = element.querySelectorAll('.extra-item');
    items.forEach(item => {
      const handleSelection = () => {
        const extraId = item.dataset.extraId;
        const extra = EXTRA_INGREDIENTS.find(e => e.id === extraId);
        if (!extra) return;

        const isSelected = currentExtras.some(e => e.id === extraId);

        if (isSelected) {
          onRemove(extraId);
        } else {
          onAdd(extra);
        }
      };

      item.addEventListener('click', handleSelection);
      item.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleSelection();
        }
      });
    });
  }

  return {
    build,
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}
