/**
 * PizzaFlow — Coupon Domain Model
 * Gerencia cupons de desconto locais.
 */

const MOCK_COUPONS = {
  'PIZZA10': { code: 'PIZZA10', type: 'percentage', value: 10 },
  'QUERO5': { code: 'QUERO5', type: 'fixed', value: 5.00 },
  'FRETEGRATIS': { code: 'FRETEGRATIS', type: 'free_shipping', value: 0 }
};

export class Coupon {
  constructor() {
    this.activeCoupon = null;
  }

  /**
   * Valida se um código de cupom é válido
   * @param {string} code 
   * @returns {boolean}
   */
  validate(code) {
    if (!code) return false;
    const cleanCode = String(code).toUpperCase().trim();
    return !!MOCK_COUPONS[cleanCode];
  }

  /**
   * Aplica um cupom de desconto
   * @param {string} code 
   * @returns {object|null} Dados do cupom aplicado
   */
  apply(code) {
    if (!this.validate(code)) return null;
    const cleanCode = String(code).toUpperCase().trim();
    this.activeCoupon = MOCK_COUPONS[cleanCode];
    return this.activeCoupon;
  }

  /**
   * Remove o cupom ativo
   */
  remove() {
    this.activeCoupon = null;
  }

  /**
   * Calcula o desconto a partir do subtotal do carrinho
   * @param {number} subtotal 
   * @param {number} shippingCost 
   * @returns {number} Valor do desconto
   */
  calculateDiscount(subtotal, shippingCost = 0) {
    if (!this.activeCoupon) return 0;
    
    if (this.activeCoupon.type === 'percentage') {
      return subtotal * (this.activeCoupon.value / 100);
    }
    if (this.activeCoupon.type === 'fixed') {
      return Math.min(subtotal, this.activeCoupon.value);
    }
    if (this.activeCoupon.type === 'free_shipping') {
      return shippingCost;
    }
    return 0;
  }

  /**
   * Retorna o cupom ativo
   * @returns {object|null}
   */
  getActiveCoupon() {
    return this.activeCoupon;
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const cp = new Coupon();
   console.log('Validação de cupom:', cp.validate('pizza10')); // Deve imprimir: true
   cp.apply('pizza10');
   console.log('Desconto de 10% sobre R$ 80:', cp.calculateDiscount(80)); // Deve imprimir: 8
   ========================================================================== */
