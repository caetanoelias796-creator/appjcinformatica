/**
 * PizzaFlow — CouponInput Component
 * Input de aplicação e remoção de cupom de desconto.
 */

import { CartStore } from '@/core/CartStore.js';

/**
 * Cria o input de cupons de desconto
 * @param {object} options
 * @param {Function} options.onApplied - Callback disparado ao aplicar com sucesso
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function CouponInput({ onApplied }) {
  let element = null;

  function build() {
    element = document.createElement('div');
    element.className = 'coupon-container-wrapper';
    element.style.width = '100%';
    render();
    return element;
  }

  function render() {
    if (!element) return;

    const coupon = CartStore.getCoupon().getActiveCoupon();

    if (coupon) {
      // Cupom ativo
      element.innerHTML = `
        <div class="coupon-badge">
          <span>🏷️ Cupom <strong>${coupon.code}</strong> aplicado</span>
          <button class="coupon-remove-btn" aria-label="Remover cupom" type="button">×</button>
        </div>
      `;
      element.querySelector('.coupon-remove-btn')?.addEventListener('click', () => {
        CartStore.removeCoupon();
        if (onApplied) onApplied();
      });
    } else {
      // Nenhum cupom ativo
      element.innerHTML = `
        <div class="coupon-container">
          <div class="coupon-input-wrapper">
            <input 
              type="text" 
              class="coupon-input" 
              placeholder="CUPOM DE DESCONTO" 
              aria-label="Digitar cupom de desconto" 
              id="coupon-text-field"
            />
          </div>
          <button class="coupon-apply-btn" type="button">Aplicar</button>
        </div>
      `;

      const input = element.querySelector('#coupon-text-field');
      const applyBtn = element.querySelector('.coupon-apply-btn');

      const handleApply = () => {
        const value = input.value.trim();
        if (!value) return;

        const isOk = CartStore.applyCoupon(value);
        if (isOk) {
          if (onApplied) onApplied();
        } else {
          input.style.borderColor = 'var(--color-primary)';
          input.placeholder = 'CUPOM INVÁLIDO';
          input.value = '';
          setTimeout(() => {
            input.style.borderColor = 'var(--color-border)';
            input.placeholder = 'CUPOM DE DESCONTO';
          }, 2000);
        }
      };

      applyBtn?.addEventListener('click', handleApply);
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApply();
        }
      });
    }
  }

  function update() {
    render();
  }

  return { build, update };
}
