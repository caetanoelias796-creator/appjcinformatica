/**
 * PizzaFlow — OrderFactory Domain Model
 * Fábrica de pedidos encarregada de construir e validar a entidade Order a partir do CartStore.
 */

import { Order } from './Order.js';
import { OrderValidator } from './OrderValidator.js';
import { CartStore } from '@/core/CartStore.js';
import { EventBus } from '@/core/EventBus.js';

export const OrderFactory = {
  /**
   * Cria e valida um novo pedido com base no estado atual do carrinho
   * @param {object} params
   * @param {object} params.address - Endereço do usuário para entrega
   * @param {string} params.paymentMethod - Método de pagamento selecionado (Ex: pix, credit)
   * @param {string} [params.notes] - Observações gerais do pedido
   * @returns {{ order: Order|null, isValid: boolean, error: string|null }}
   */
  createFromCart({ address, paymentMethod, notes = '' }) {
    const items = CartStore.getItems();
    const shippingMethod = CartStore.getShipping().getMethod();
    
    const subtotal = CartStore.subtotal();
    const extras = CartStore.extras();
    const discount = CartStore.discount();
    const shipping = CartStore.shipping();
    const total = CartStore.total();

    const orderData = {
      items,
      shippingMethod,
      address,
      paymentMethod,
      total
    };

    // Valida os dados antes de gerar a entidade
    const validation = OrderValidator.validate(orderData);
    if (!validation.isValid) {
      return { order: null, isValid: false, error: validation.error };
    }

    // Cria a entidade de pedido
    const newOrder = new Order({
      items,
      shippingMethod,
      address,
      paymentMethod,
      notes,
      summary: {
        subtotal,
        extras,
        discount,
        shipping,
        total
      }
    });

    // Publica criação do pedido no EventBus
    EventBus.publish('order:create', newOrder);

    return { order: newOrder, isValid: true, error: null };
  }
};

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   // Criando um pedido a partir do CartStore (com carrinho vazio, deve falhar)
   const result = OrderFactory.createFromCart({
     address: { street: 'Av Paulista', number: '1000' },
     paymentMethod: 'pix'
   });
   console.log('Resultado do Factory:', result.isValid, result.error); // false, "O carrinho está vazio."
   ========================================================================== */
