import { formatCurrency } from '@utils/formatters.js';
import { EventBus } from '@/core/EventBus.js';
import { PizzaRules } from '@/core/PizzaRules.js';

/**
 * Lista de bordas fallback caso a API/mockData não responda
 */
const DEFAULT_BORDERS = {
  'sem-borda': { name: 'Sem Borda', price: 0.00, category: 'ambas' },
  'tradicional': { name: 'Borda Tradicional', price: 0.00, category: 'ambas' },
  'catupiry': { name: 'Borda de Catupiry', price: 5.00, category: 'salgadas' },
  'cheddar': { name: 'Borda de Cheddar', price: 5.00, category: 'salgadas' },
  'chocolate': { name: 'Borda de Chocolate', price: 6.00, category: 'doces' }
};

/**
 * Cria o seletor de bordas
 * @param {object} options
 * @param {object} [options.bordersList] - Objeto contendo as bordas disponíveis
 * @param {Function} options.onChange - Callback executado ao alterar a borda
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function CrustSelector({ bordersList = DEFAULT_BORDERS, onChange }) {
  let element = null;
  let currentCrustId = null;
  let unsubscribe = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('section');
    element.className = 'product-modal-section';
    element.id = 'product-modal-crust-section';

    // Escuta evento para atualizar automaticamente
    unsubscribe = EventBus.subscribe('product:updated', ({ config }) => {
      update(config);
    });

    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;

    const { product, crust } = state;
    if (!product) return;

    currentCrustId = crust?.id || 'sem-borda';

    // Filtra bordas compatíveis utilizando a validação de PizzaRules
    const list = bordersList || DEFAULT_BORDERS;
    const compatibleBorders = PizzaRules.allowedCrusts(product, list);

    element.innerHTML = `
      <div class="product-modal-section-title-wrapper">
        <h3 class="product-modal-section-title">
          <span>🍕 Escolha a borda</span>
        </h3>
        <span class="product-modal-section-badge">Opcional</span>
      </div>
      <div class="selector-grid" role="radiogroup" aria-label="Borda da pizza">
        ${compatibleBorders.map(b => {
          const isSelected = b.id === currentCrustId;
          const priceText = b.price > 0 ? `+${formatCurrency(b.price)}` : 'Grátis';

          return `
            <div 
              class="selector-card ${isSelected ? 'selected' : ''}" 
              data-crust-id="${b.id}"
              role="radio"
              aria-checked="${isSelected}"
              tabindex="0"
            >
              <div class="selector-card-radio"></div>
              <span class="selector-card-label">${b.name}</span>
              <span class="selector-card-price">${priceText}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    setupEvents(compatibleBorders);
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents(compatibleBorders) {
    const cards = element.querySelectorAll('.selector-card');
    cards.forEach(card => {
      const handleSelection = () => {
        const crustId = card.dataset.crustId;
        const selected = compatibleBorders.find(b => b.id === crustId);
        if (selected && selected.id !== currentCrustId) {
          onChange(selected);
        }
      };

      card.addEventListener('click', handleSelection);
      card.addEventListener('keydown', (e) => {
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
