/**
 * PizzaFlow — Size Selector Component
 * Seleção do tamanho da pizza (Broto, Média, Grande, Gigante).
 */

import { formatCurrency } from '@utils/formatters.js';

/**
 * Cria o seletor de tamanho
 * @param {object} options
 * @param {Function} options.onChange - Callback executado ao mudar o tamanho
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function SizeSelector({ onChange }) {
  let element = null;
  let currentSizeId = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('section');
    element.className = 'product-modal-section';
    element.id = 'product-modal-size-section';
    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;

    const { product, size } = state;
    if (!product || !product.sizes) return;

    currentSizeId = size?.id;

    element.innerHTML = `
      <div class="product-modal-section-title-wrapper">
        <h3 class="product-modal-section-title">
          <span>📏 Escolha o tamanho</span>
        </h3>
        <span class="product-modal-section-badge required">Obrigatório</span>
      </div>
      <div class="selector-grid" role="radiogroup" aria-label="Tamanho da pizza">
        ${product.sizes.map(s => {
          const isSelected = s.id === currentSizeId;
          return `
            <div 
              class="selector-card ${isSelected ? 'selected' : ''}" 
              data-size-id="${s.id}"
              role="radio"
              aria-checked="${isSelected}"
              tabindex="0"
            >
              <div class="selector-card-radio"></div>
              <span class="selector-card-label">${s.label}</span>
              <span class="selector-card-price">${formatCurrency(s.price)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    setupEvents(product.sizes);
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents(sizes) {
    const cards = element.querySelectorAll('.selector-card');
    cards.forEach(card => {
      const handleSelection = () => {
        const sizeId = card.dataset.sizeId;
        const selected = sizes.find(s => s.id === sizeId);
        if (selected && selected.id !== currentSizeId) {
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

  return { build, update };
}
