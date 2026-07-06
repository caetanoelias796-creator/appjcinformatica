import { formatCurrency } from '@utils/formatters.js';
import { EventBus } from '@/core/EventBus.js';

/**
 * Cria o resumo de preço
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function PriceSummary() {
  let element = null;
  let unsubscribe = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('div');
    element.className = 'price-summary-container';

    // Escuta evento para atualizar automaticamente
    unsubscribe = EventBus.subscribe('product:updated', ({ config, pricing }) => {
      update(config, pricing);
    });

    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(config, pricing) {
    if (!element || !config || !pricing) return;

    const { quantity = 1 } = config;
    const { subtotal, extras, borda, total } = pricing;

    const unitBasePrice = subtotal / quantity;
    const baseSummary = `${quantity}x ${formatCurrency(unitBasePrice)}`;
    const borderSummary = borda > 0 ? `Borda: +${formatCurrency(borda)}` : '';
    const extrasSummary = extras > 0 ? `Extras: +${formatCurrency(extras)}` : '';

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

  return {
    build,
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}
