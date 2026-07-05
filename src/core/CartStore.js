/**
 * PizzaFlow — CartStore
 * Gerenciador de itens do carrinho. Armazena a lista de itens ativos e notifica alterações via EventBus.
 */

import { EventBus } from './EventBus.js';
import { PriceEngine } from './PriceEngine.js';

class CartStoreClass {
  constructor() {
    this.items = [];
  }

  /**
   * Retorna os itens do carrinho
   * @returns {object[]} Lista de itens no carrinho
   */
  getItems() {
    return [...this.items];
  }

  /**
   * Adiciona um item configurado pelo ProductBuilder ao carrinho
   * @param {object} config - Objeto configurado do produto
   */
  addItem(config) {
    const pricing = PriceEngine.calculate(config);
    const cartItemId = this.#generateUniqueKey(config);

    const cartItem = {
      ...config,
      cartItemId,
      unitPrice: pricing.total / config.quantity,
      totalPrice: pricing.total
    };

    const existingIndex = this.items.findIndex(item => item.cartItemId === cartItemId);
    
    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += config.quantity;
      const updatedPricing = PriceEngine.calculate(this.items[existingIndex]);
      this.items[existingIndex].totalPrice = updatedPricing.total;
    } else {
      this.items.push(cartItem);
    }

    // Publica eventos no EventBus
    EventBus.publish('cart:updated', this.getItems());
    EventBus.publish('cart:added', cartItem);
  }

  /**
   * Remove um item específico pelo ID do carrinho
   * @param {string} cartItemId 
   */
  removeItem(cartItemId) {
    const removedItem = this.items.find(item => item.cartItemId === cartItemId);
    if (!removedItem) return;

    this.items = this.items.filter(item => item.cartItemId !== cartItemId);
    
    EventBus.publish('cart:updated', this.getItems());
    EventBus.publish('cart:removed', removedItem);
  }

  /**
   * Atualiza a quantidade de um item no carrinho
   * @param {string} cartItemId 
   * @param {number} quantity 
   */
  updateQuantity(cartItemId, quantity) {
    if (quantity <= 0) {
      this.removeItem(cartItemId);
      return;
    }

    const item = this.items.find(i => i.cartItemId === cartItemId);
    if (item) {
      item.quantity = quantity;
      const pricing = PriceEngine.calculate(item);
      item.totalPrice = pricing.total;
      
      EventBus.publish('cart:updated', this.getItems());
    }
  }

  /**
   * Esvazia todo o carrinho
   */
  clear() {
    this.items = [];
    EventBus.publish('cart:updated', this.getItems());
    EventBus.publish('cart:cleared');
  }

  /**
   * Retorna o preço total do carrinho
   * @returns {number} Valor total acumulado
   */
  getTotal() {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  /**
   * Retorna o número total de itens no carrinho
   * @returns {number} Quantidade total de itens
   */
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Gera uma chave identificadora única baseada nas escolhas de personalização
   * @param {object} config 
   * @returns {string} Chave única
   */
  #generateUniqueKey(config) {
    const sizeId = config.size?.id || 'default';
    const crustId = config.crust?.id || 'sem-borda';
    const flavorIds = config.flavors ? config.flavors.map(f => f.id).sort().join(',') : 'default';
    const extraIds = config.extras ? config.extras.map(e => e.id).sort().join(',') : '';
    return `${config.id}-${sizeId}-${crustId}-[${flavorIds}]-[${extraIds}]`;
  }
}

export const CartStore = new CartStoreClass();

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   // Ouvir alterações do carrinho
   const unsub = EventBus.subscribe('cart:updated', (items) => {
     console.log('Carrinho atualizado! Qtd itens:', items.length);
   });

   const configItem = {
     id: 'mussarela',
     name: 'Pizza Mussarela',
     quantity: 1,
     size: { id: 'media', price: 80 },
     flavors: [{ id: 'mussarela', name: 'Pizza Mussarela' }]
   };

   CartStore.addItem(configItem); // Deve logar "Carrinho atualizado! Qtd itens: 1"
   console.log('Total Carrinho:', CartStore.getTotal()); // Deve imprimir: 80
   
   CartStore.clear(); // Deve logar "Carrinho atualizado! Qtd itens: 0"
   unsub();
   ========================================================================== */
