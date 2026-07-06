/**
 * PizzaFlow — Shipping Domain Model
 * Gerencia métodos e custos de entrega/retirada.
 */

export const SHIPPING_METHODS = {
  DELIVERY: 'delivery',
  PICKUP:   'pickup',
  DINE_IN:  'dine_in'
};

export class Shipping {
  constructor() {
    this.method = SHIPPING_METHODS.DELIVERY;
    this.fee = 7.00; // Valor de entrega padrão
  }

  /**
   * Define o método de frete/envio
   * @param {'delivery'|'pickup'|'dine_in'} method 
   */
  setMethod(method) {
    if (Object.values(SHIPPING_METHODS).includes(method)) {
      this.method = method;
      this.fee = method === SHIPPING_METHODS.DELIVERY ? 7.00 : 0.00;
    }
  }

  /**
   * Retorna o método atual
   * @returns {string}
   */
  getMethod() {
    return this.method;
  }

  /**
   * Retorna a taxa correspondente
   * @returns {number}
   */
  getFee() {
    return this.fee;
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const sh = new Shipping();
   console.log('Frete inicial (entrega):', sh.getFee()); // Deve imprimir: 7
   sh.setMethod('pickup');
   console.log('Frete retirada:', sh.getFee()); // Deve imprimir: 0
   ========================================================================== */
