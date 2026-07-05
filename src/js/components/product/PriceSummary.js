/**
 * PizzaFlow — Price Summary Component
 * Resumo de valores (Preço base, adicionais de borda, extras e total) no rodapé.
 */

import { formatCurrency } from '@utils/formatters.js';

/**
 * Cria o resumo de preço
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function PriceSummary() {
  let element = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('div');
    element.className = 'price-summary-container';
    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;

    const { size, flavors, subtotal, extrasTotal, bordaTotal, total, quantity } = state;
    if (!size) return;

    // 1. Calcula preço unitário base (maior valor entre os sabores)
    let unitBasePrice = 0;
    if (flavors && flavors.length > 0) {
      let maxPrice = 0;
      flavors.forEach(f => {
        const sizeObj = f.sizes?.find(s => s.id === size.id);
        if (sizeObj && sizeObj.price > maxPrice) {
          maxPrice = sizeObj.price;
        }
      });
      unitBasePrice = maxPrice || size.price || 0;
    } else {
      unitBasePrice = size.price || 0;
    }

    const baseSummary = `${quantity}x ${formatCurrency(unitBasePrice)}`;
    const borderSummary = bordaTotal > 0 ? `Borda: +${formatCurrency(bordaTotal)}` : '';
    const extrasSummary = extrasTotal > 0 ? `Extras: +${formatCurrency(extrasTotal)}` : '';

    element.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div class="price-summary-item">
          <span style="color: var(--color-text-secondary);">Preço base:</span>
          <span style="font-weight: var(--weight-medium); color: var(--color-text-primary);">${baseSummary}</span>
        </div>
        ${borderSummary ? `
          <div class="price-summary-item">
            <span style="color: var(--color-text-secondary);">Bordas:</span>
            <span style="font-weight: var(--weight-medium); color: var(--color-success);">${borderSummary}</span>
          </div>
        ` : ''}
        ${extrasSummary ? `
          <div class="price-summary-item">
            <span style="color: var(--color-text-secondary);">Adicionais:</span>
            <span style="font-weight: var(--weight-medium); color: var(--color-success);">${extrasSummary}</span>
          </div>
        ` : ''}
      </div>
      <div style="text-align: right;">
        <span style="font-size: var(--text-xs); color: var(--color-text-secondary); display: block; margin-bottom: 2px;">Valor Total</span>
        <div class="price-summary-total">${formatCurrency(total)}</div>
      </div>
    `;
  }

  return { build, update };
}
