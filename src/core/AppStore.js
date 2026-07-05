/**
 * PizzaFlow — AppStore
 * Centraliza e publica o estado global do aplicativo (página ativa, modal ativo, carregamentos).
 */

import { EventBus } from './EventBus.js';

class AppStoreClass {
  #state;

  constructor() {
    this.#state = {
      currentPage: 'home',
      activeProductModalId: null,
      loading: false,
      user: {
        name: null,
        address: null,
        addressData: null
      }
    };
  }

  /**
   * Retorna uma cópia do estado global
   * @returns {object} Estado do aplicativo
   */
  getState() {
    return structuredClone(this.#state);
  }

  /**
   * Modifica a página ativa e notifica ouvintes
   * @param {string} page - Nome da nova página
   */
  setCurrentPage(page) {
    const prev = this.#state.currentPage;
    if (prev === page) return;

    this.#state.currentPage = page;
    EventBus.publish('page:changed', { current: page, previous: prev });
  }

  /**
   * Modifica o status de carregamento e notifica ouvintes
   * @param {boolean} isLoading 
   */
  setLoading(isLoading) {
    const val = Boolean(isLoading);
    if (this.#state.loading === val) return;

    this.#state.loading = val;
    EventBus.publish('loading:changed', this.#state.loading);
  }

  /**
   * Atualiza as informações do usuário logado
   * @param {object} userUpdates 
   */
  setUser(userUpdates) {
    this.#state.user = {
      ...this.#state.user,
      ...userUpdates
    };
    EventBus.publish('user:changed', this.#state.user);
  }

  /**
   * Modifica o ID do produto ativo no ProductModal
   * @param {string|null} productId 
   */
  setActiveModal(productId) {
    if (this.#state.activeProductModalId === productId) return;

    this.#state.activeProductModalId = productId;
    EventBus.publish('modal:changed', productId);
  }
}

export const AppStore = new AppStoreClass();

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   // Ouvir alterações de página
   const unsub = EventBus.subscribe('page:changed', (data) => {
     console.log(`Página mudou de "${data.previous}" para "${data.current}"`);
   });

   AppStore.setCurrentPage('carrinho'); // Deve logar: Página mudou de "home" para "carrinho"
   console.log('Página Atual:', AppStore.getState().currentPage); // Deve imprimir: "carrinho"
   
   unsub();
   ========================================================================== */
