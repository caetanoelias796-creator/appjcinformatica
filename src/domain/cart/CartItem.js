/**
 * PizzaFlow — CartItem Domain Model
 * Representa um item configurado e precificado dentro do carrinho.
 */

export class CartItem {
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
    totalPrice = 0,
    image = ''
  }) {
    this.id = id;
    this.productId = productId;
    this.productName = productName;
    this.size = size; // { id, label, price }
    this.flavors = flavors || []; // [{ id, name }]
    this.crust = crust || null; // { id, name, price }
    this.extras = extras; // [{ id, name, price }]
    this.observation = observation;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.totalPrice = totalPrice;
    this.image = image;
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const item = new CartItem({
     id: 'mussarela-media',
     productId: 'mussarela',
     productName: 'Mussarela',
     size: { id: 'media', label: 'Média', price: 80 },
     quantity: 1,
     unitPrice: 80,
     totalPrice: 80
   });
   console.log('Item criado:', item.productName, item.totalPrice); // Mussarela 80
   ========================================================================== */
