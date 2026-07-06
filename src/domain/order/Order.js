/**
 * PizzaFlow — Order Domain Model
 * Entidade central de pedido que controla seu ciclo de vida, status e valores.
 */

import { ORDER_STATUS, OrderStatus } from './OrderStatus.js';
import { OrderSummary } from './OrderSummary.js';
import { OrderItem } from './OrderItem.js';
import { EventBus } from '@/core/EventBus.js';

export class Order {
  constructor({
    id,
    items = [],
    shippingMethod,
    address = null,
    paymentMethod,
    summary,
    notes = '',
    createdAt = new Date(),
    status = ORDER_STATUS.PENDING
  }) {
    this.id = id || `order-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    this.items = items.map(item => new OrderItem(item));
    this.shippingMethod = shippingMethod;
    this.address = address ? { ...address } : null;
    this.paymentMethod = paymentMethod;
    this.summary = new OrderSummary(summary);
    this.notes = notes;
    this.createdAt = new Date(createdAt);
    this.status = status;
  }

  /**
   * Atualiza o status do pedido validando a transição
   * @param {string} nextStatus 
   * @returns {boolean}
   */
  updateStatus(nextStatus) {
    if (!OrderStatus.isValidTransition(this.status, nextStatus)) {
      console.warn(`[Order] Transição de status inválida de "${this.status}" para "${nextStatus}"`);
      return false;
    }

    const previousStatus = this.status;
    this.status = nextStatus;

    // Publica alteração via EventBus
    EventBus.publish('order:status_change', {
      orderId: this.id,
      previousStatus,
      currentStatus: this.status
    });

    return true;
  }

  /**
   * Retorna os dados serializados do pedido
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      items: this.items,
      shippingMethod: this.shippingMethod,
      address: this.address,
      paymentMethod: this.paymentMethod,
      summary: this.summary,
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      status: this.status
    };
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const ord = new Order({
     id: 'ORD-123',
     items: [],
     shippingMethod: 'pickup',
     paymentMethod: 'pix',
     summary: { total: 50 },
     status: 'pending'
   });
   console.log('Status inicial:', ord.status); // pending
   ord.updateStatus('confirmed');
   console.log('Status apos transicao:', ord.status); // confirmed
   ========================================================================== */
