/**
 * PizzaFlow — OrderItem Domain Model
 * Representa a foto imutável de um item adicionado ao pedido no momento de sua criação.
 */

export class OrderItem {
  constructor({
    id,
    productId,
    productName,
    size,
    flavors,
    crust,
    extras = [],
    observation = '',
    quantity = 1,
    unitPrice = 0,
    totalPrice = 0
  }) {
    this.id = id;
    this.productId = productId;
    this.productName = productName;
    this.size = size ? { ...size } : null;
    this.flavors = flavors ? flavors.map(f => ({ ...f })) : [];
    this.crust = crust ? { ...crust } : null;
    this.extras = extras ? extras.map(e => ({ ...e })) : [];
    this.observation = observation;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.totalPrice = totalPrice;
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const item = new OrderItem({
     id: '123',
     productId: 'mussarela',
     productName: 'Mussarela',
     quantity: 2,
     unitPrice: 35,
     totalPrice: 70
   });
   console.log('Quantidade item pedido:', item.quantity); // 2
   ========================================================================== */
