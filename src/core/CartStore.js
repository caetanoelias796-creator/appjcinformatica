/**
 * PizzaFlow — CartStore
 * Centralizador e ponte de comunicação reativa do domínio do Carrinho (Cart).
 * Implementa a interface pública e sincroniza operações com a entidade do domínio.
 */

import { Cart } from '@/domain/cart/Cart.js';

class CartStoreClass {
  constructor() {
    this.cartInstance = new Cart();
  }

  /**
   * Retorna os itens do carrinho
   * @returns {object[]}
   */
  getItems() {
    return this.cartInstance.items();
  }

  /**
   * Adiciona um item configurado
   * @param {object} config 
   */
  addItem(config) {
    this.cartInstance.add(config);
  }

  /**
   * Alias de addItem para integração da RFC-001/RFC-003
   * @param {object} config 
   */
  add(config) {
    this.cartInstance.add(config);
  }

  /**
   * Remove um item específico pelo ID do carrinho
   * @param {string} cartItemId 
   */
  removeItem(cartItemId) {
    this.cartInstance.remove(cartItemId);
  }

  /**
   * Atualiza a quantidade de um item no carrinho
   * @param {string} cartItemId 
   * @param {number} quantity 
   */
  updateQuantity(cartItemId, quantity) {
    this.cartInstance.update(cartItemId, quantity);
  }

  /**
   * Esvazia todo o carrinho
   */
  clear() {
    this.cartInstance.clear();
  }

  /**
   * Retorna o preço total do carrinho
   * @returns {number}
   */
  getTotal() {
    return this.cartInstance.total();
  }

  /**
   * Retorna o número total de itens no carrinho
   * @returns {number}
   */
  getItemCount() {
    return this.cartInstance.count();
  }

  /**
   * Métodos auxiliares de domínio
   */
  subtotal() { return this.cartInstance.subtotal(); }
  extras() { return this.cartInstance.extras(); }
  discount() { return this.cartInstance.discount(); }
  shipping() { return this.cartInstance.shipping(); }
  total() { return this.cartInstance.total(); }
  
  getCoupon() { return this.cartInstance.getCouponDomain(); }
  getShipping() { return this.cartInstance.getShippingDomain(); }

  applyCoupon(code) {
    return this.cartInstance.applyCoupon(code);
  }

  removeCoupon() {
    this.cartInstance.removeCoupon();
  }

  setShippingMethod(method) {
    this.cartInstance.setShippingMethod(method);
  }
}

export const CartStore = new CartStoreClass();

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   console.log('Quantidade de itens:', CartStore.getItemCount()); // Deve mostrar itens persistidos
   console.log('Total carrinho:', CartStore.getTotal());
   ========================================================================== */
