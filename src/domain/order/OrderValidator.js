/**
 * PizzaFlow — OrderValidator Domain Model
 * Centraliza as regras de validação necessárias para que um pedido seja aceito no sistema.
 */

export const OrderValidator = {
  /**
   * Valida se as informações do carrinho e configurações do pedido são consistentes
   * @param {object} orderData
   * @returns {{ isValid: boolean, error: string|null }}
   */
  validate(orderData) {
    const { items, shippingMethod, address, paymentMethod, total } = orderData;

    // 1. Deve possuir itens
    if (!items || items.length === 0) {
      return { isValid: false, error: 'O carrinho está vazio.' };
    }

    // 2. Quantidade de itens deve ser positiva
    const hasInvalidQty = items.some(item => !item.quantity || item.quantity <= 0);
    if (hasInvalidQty) {
      return { isValid: false, error: 'Existem itens com quantidade inválida.' };
    }

    // 3. Valor mínimo do pedido (Ex: R$ 15.00)
    const MINIMUM_ORDER_VALUE = 15.00;
    if (total < MINIMUM_ORDER_VALUE) {
      return { isValid: false, error: `O valor mínimo para pedidos é de R$ ${MINIMUM_ORDER_VALUE.toFixed(2)}.` };
    }

    // 4. Se for método de entrega, exige endereço cadastrado/selecionado
    if (shippingMethod === 'delivery') {
      if (!address || !address.street || !address.number) {
        return { isValid: false, error: 'Endereço de entrega é obrigatório para a modalidade Delivery.' };
      }
    }

    // 5. Exige um método de pagamento válido
    if (!paymentMethod) {
      return { isValid: false, error: 'Selecione uma forma de pagamento.' };
    }

    return { isValid: true, error: null };
  }
};

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   const result = OrderValidator.validate({ items: [] });
   console.log('Validacao vazio:', result.isValid, result.error); // false "O carrinho está vazio."
   ========================================================================== */
