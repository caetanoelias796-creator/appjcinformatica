/**
 * PizzaFlow — OrderSummary Domain Model
 * Totalizadores financeiros imutáveis de um pedido criado.
 */

export class OrderSummary {
  constructor({ subtotal = 0, extras = 0, discount = 0, shipping = 0, total = 0 }) {
    this.subtotal = subtotal;
    this.extras = extras;
    this.discount = discount;
    this.shipping = shipping;
    this.total = total;
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const summary = new OrderSummary({ subtotal: 70, discount: 5, total: 65 });
   console.log('Total pedido:', summary.total); // 65
   ========================================================================== */
