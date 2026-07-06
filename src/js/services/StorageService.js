/**
 * PizzaFlow — StorageService
 * Serviço de persistência do carrinho em LocalStorage.
 * Pronto para futura substituição por chamadas de API.
 */

const STORAGE_KEY = 'pizzaflow_cart_v3';

export const StorageService = {
  /**
   * Salva os dados do carrinho de forma persistente
   * @param {object} cartData 
   * @returns {Promise<boolean>}
   */
  async saveCart(cartData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));
      return true;
    } catch (err) {
      console.error('[StorageService] Erro ao salvar o carrinho:', err);
      return false;
    }
  },

  /**
   * Recupera os dados do carrinho salvos
   * @returns {Promise<object|null>}
   */
  async loadCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[StorageService] Erro ao carregar o carrinho:', err);
      return null;
    }
  },

  /**
   * Limpa a persistência do carrinho
   * @returns {Promise<boolean>}
   */
  async clearCart() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (err) {
      console.error('[StorageService] Erro ao limpar o carrinho:', err);
      return false;
    }
  }
};

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   // Teste de gravação e leitura
   (async () => {
     await StorageService.saveCart({ items: [{ id: 'teste' }] });
     const cart = await StorageService.loadCart();
     console.log('Dados salvos no Storage:', cart.items[0].id); // Deve imprimir: "teste"
     await StorageService.clearCart();
   })();
   ========================================================================== */
