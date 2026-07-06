/**
 * PizzaFlow — Cart Domain Model
 * Entidade central de domínio que gerencia as operações, regras de negócio e totais do carrinho.
 */

import { CartItem } from './CartItem.js';
import { Coupon } from './Coupon.js';
import { Shipping } from './Shipping.js';
import { Summary } from './Summary.js';
import { StorageService } from '@services/StorageService.js';
import { EventBus } from '@/core/EventBus.js';
import { PriceEngine } from '@/core/PriceEngine.js';

export class Cart {
  #items;
  #coupon;
  #shipping;

  constructor() {
    this.#items = [];
    this.#coupon = new Coupon();
    this.#shipping = new Shipping();
    
    // Auto-restauração ao iniciar
    this.restoreFromStorage();

    // Responde a solicitações de atualização imediata (ex: FloatingCart inicializando)
    EventBus.subscribe('cart:request_update', () => {
      this.#notifyUpdate();
    });
  }

  /**
   * Adiciona um item ao carrinho
   * @param {object} config - Objeto configurado vindo do ProductBuilder
   */
  add(config) {
    const pricing = PriceEngine.calculate(config);
    const cartItemId = this.#generateUniqueKey(config);

    const newItem = new CartItem({
      id: cartItemId,
      productId: config.id,
      productName: config.name,
      size: config.size,
      flavors: config.flavors,
      crust: config.crust,
      extras: config.extras,
      observation: config.note || '',
      quantity: config.quantity,
      unitPrice: pricing.total / config.quantity,
      totalPrice: pricing.total,
      image: config.image
    });

    const existingIndex = this.#items.findIndex(item => item.id === cartItemId);
    
    if (existingIndex >= 0) {
      this.#items[existingIndex].quantity += config.quantity;
      const updatedPricing = PriceEngine.calculate(this.#items[existingIndex]);
      this.#items[existingIndex].totalPrice = updatedPricing.total;
    } else {
      this.#items.push(newItem);
    }

    this.#saveAndNotify();
    EventBus.publish('cart:add', newItem);
  }

  /**
   * Remove um item pelo ID único do carrinho
   * @param {string} cartItemId 
   */
  remove(cartItemId) {
    const removedItem = this.#items.find(item => item.id === cartItemId);
    if (!removedItem) return;

    this.#items = this.#items.filter(item => item.id !== cartItemId);
    this.#saveAndNotify();
    EventBus.publish('cart:remove', removedItem);
  }

  /**
   * Atualiza a quantidade de um item
   * @param {string} cartItemId 
   * @param {number} quantity 
   */
  update(cartItemId, quantity) {
    if (quantity <= 0) {
      this.remove(cartItemId);
      return;
    }

    const item = this.#items.find(i => i.id === cartItemId);
    if (item) {
      item.quantity = quantity;
      const pricing = PriceEngine.calculate(item);
      item.totalPrice = pricing.total;
      this.#saveAndNotify();
    }
  }

  /**
   * Limpa todo o carrinho
   */
  clear() {
    this.#items = [];
    this.#coupon.remove();
    StorageService.clearCart();
    this.#notifyUpdate();
    EventBus.publish('cart:clear');
  }

  /**
   * Retorna os itens ativos
   * @returns {CartItem[]}
   */
  items() {
    return [...this.#items];
  }

  /**
   * Retorna a quantidade total de itens no carrinho
   * @returns {number}
   */
  count() {
    return this.#items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Retorna o subtotal unitário das pizzas básicas sem adicionais extras
   * @returns {number}
   */
  subtotal() {
    return this.#items.reduce((sum, item) => {
      // Para obter o preço base real do tamanho, calculamos apenas o preço base unitário do tamanho * quantidade
      const basePrice = item.size?.price || item.unitPrice;
      return sum + (basePrice * item.quantity);
    }, 0);
  }

  /**
   * Retorna o valor de desconto ativo
   * @returns {number}
   */
  discount() {
    const subtotal = this.subtotal() + this.extras();
    return this.#coupon.calculateDiscount(subtotal, this.shipping());
  }

  /**
   * Retorna a taxa de frete
   * @returns {number}
   */
  shipping() {
    return this.#shipping.getFee();
  }

  /**
   * Retorna a soma de adicionais (extras e bordas)
   * @returns {number}
   */
  extras() {
    return this.#items.reduce((sum, item) => {
      const borderPrice = item.crust ? parseFloat(item.crust.price || 0) : 0;
      const extrasPrice = item.extras ? item.extras.reduce((s, e) => s + parseFloat(e.price || 0), 0) : 0;
      return sum + ((borderPrice + extrasPrice) * item.quantity);
    }, 0);
  }

  /**
   * Retorna o valor total com frete, adicionais e descontos
   * @returns {number}
   */
  total() {
    const summary = new Summary({
      subtotal: this.subtotal(),
      extras: this.extras(),
      discount: this.discount(),
      shipping: this.shipping()
    });
    return summary.total;
  }

  /**
   * Retorna as instâncias de cupom e envio
   */
  getCouponDomain() {
    return this.#coupon;
  }

  getShippingDomain() {
    return this.#shipping;
  }

  applyCoupon(code) {
    const applied = this.#coupon.apply(code);
    if (applied) {
      this.#saveAndNotify();
    }
    return applied;
  }

  removeCoupon() {
    this.#coupon.remove();
    this.#saveAndNotify();
  }

  setShippingMethod(method) {
    this.#shipping.setMethod(method);
    this.#saveAndNotify();
  }

  /* ── PERSISTÊNCIA ────────────────────────────────────────── */

  async restoreFromStorage() {
    const data = await StorageService.loadCart();
    if (data) {
      this.#items = (data.items || []).map(i => new CartItem(i));
      if (data.coupon) {
        this.#coupon.apply(data.coupon.code);
      }
      if (data.shippingMethod) {
        this.#shipping.setMethod(data.shippingMethod);
      }
      EventBus.publish('cart:restore', this.items());
    }
    this.#notifyUpdate();
  }

  async #saveAndNotify() {
    const serialized = {
      items: this.#items,
      coupon: this.#coupon.getActiveCoupon(),
      shippingMethod: this.#shipping.getMethod()
    };
    await StorageService.saveCart(serialized);
    this.#notifyUpdate();
  }

  #notifyUpdate() {
    EventBus.publish('cart:update', {
      items: this.items(),
      count: this.count(),
      total: this.total(),
      subtotal: this.subtotal(),
      extras: this.extras(),
      discount: this.discount(),
      shipping: this.shipping()
    });
  }

  #generateUniqueKey(config) {
    const sizeId = config.size?.id || 'default';
    const crustId = config.crust?.id || 'sem-borda';
    const flavorIds = config.flavors ? config.flavors.map(f => f.id).sort().join(',') : 'default';
    const extraIds = config.extras ? config.extras.map(e => e.id).sort().join(',') : '';
    const note = config.note || '';
    return `${config.id}-${sizeId}-${crustId}-[${flavorIds}]-[${extraIds}]-[${note}]`;
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   const cart = new Cart();
   const mockPizza = {
     id: 'mussarela',
     name: 'Pizza Mussarela',
     quantity: 1,
     size: { id: 'media', price: 80 },
     flavors: [{ id: 'mussarela', name: 'Pizza Mussarela' }]
   };
   
   cart.add(mockPizza);
   console.log('Itens no carrinho:', cart.count()); // Deve imprimir: 1
   console.log('Subtotal do carrinho:', cart.subtotal()); // Deve imprimir: 80
   ========================================================================== */
