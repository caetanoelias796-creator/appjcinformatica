/**
 * PizzaFlow — OrderStatus Domain Model
 * Definição centralizada dos estados possíveis de um pedido e transições permitidas.
 */

export const ORDER_STATUS = {
  PENDING: 'pending',          // Pedido criado, aguardando confirmação/pagamento
  CONFIRMED: 'confirmed',      // Confirmado pelo estabelecimento
  PREPARING: 'preparing',      // Na cozinha/preparação
  READY: 'ready',              // Pronto para retirada ou envio
  SHIPPED: 'shipped',          // Saiu para entrega (se delivery)
  DELIVERED: 'delivered',      // Entregue / Retirado com sucesso
  CANCELLED: 'cancelled'       // Cancelado
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Aguardando Confirmação',
  [ORDER_STATUS.CONFIRMED]: 'Confirmado',
  [ORDER_STATUS.PREPARING]: 'Em Preparação',
  [ORDER_STATUS.READY]: 'Pronto para Retirada',
  [ORDER_STATUS.SHIPPED]: 'Saiu para Entrega',
  [ORDER_STATUS.DELIVERED]: 'Entregue',
  [ORDER_STATUS.CANCELLED]: 'Cancelado'
};

export const OrderStatus = {
  /**
   * Verifica se a transição de um status para outro é válida
   * @param {string} currentStatus 
   * @param {string} nextStatus 
   * @returns {boolean}
   */
  isValidTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return true;
    if (currentStatus === ORDER_STATUS.CANCELLED || currentStatus === ORDER_STATUS.DELIVERED) {
      return false; // Estados finais não podem ser alterados
    }

    const transitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.READY]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED]
    };

    return (transitions[currentStatus] || []).includes(nextStatus);
  },

  /**
   * Retorna a etiqueta legível do status
   * @param {string} status 
   * @returns {string}
   */
  getLabel(status) {
    return ORDER_STATUS_LABELS[status] || 'Status Desconhecido';
  }
};

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   console.log('Transição pendente -> confirmado:', OrderStatus.isValidTransition('pending', 'confirmed')); // true
   console.log('Transição entregue -> cancelado:', OrderStatus.isValidTransition('delivered', 'cancelled')); // false
   ========================================================================== */
