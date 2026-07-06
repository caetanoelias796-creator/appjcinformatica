/**
 * PizzaFlow — Summary Domain Model
 * Calcula os totais do carrinho incluindo adicionais, frete e cupons de desconto.
 */

export class Summary {
  constructor({ subtotal = 0, extras = 0, discount = 0, shipping = 0 }) {
    this.subtotal = subtotal;
    this.extras = extras;
    this.discount = discount;
    this.shipping = shipping;
    // Total não pode ser negativo
    this.total = Math.max(0, subtotal + extras + shipping - discount);
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const sm = new Summary({ subtotal: 80, extras: 5, discount: 8, shipping: 7 });
   console.log('Total calculado:', sm.total); // Deve imprimir: 84 (80 + 5 + 7 - 8)
   ========================================================================== */
