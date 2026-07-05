/**
 * PizzaFlow — EventBus
 * Barramento de eventos baseado no padrão Publish/Subscribe para comunicação desacoplada.
 */

class EventBusClass {
  constructor() {
    this.listeners = {};
  }

  /**
   * Se inscreve em um canal de evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função a ser chamada
   * @returns {Function} Função para cancelar a inscrição
   */
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Retorna a função de cancelamento da inscrição
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Publica dados em um canal de evento
   * @param {string} event - Nome do evento
   * @param {any} data - Dados a enviar aos ouvintes
   */
  publish(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventBus] Erro ao disparar ouvinte para o evento "${event}":`, err);
      }
    });
  }
}

export const EventBus = new EventBusClass();

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   // 1. Se inscrever no evento
   const unsub = EventBus.subscribe('pizza:adicionada', (pizza) => {
     console.log('Pizza customizada adicionada:', pizza.name);
   });

   // 2. Publicar evento
   EventBus.publish('pizza:adicionada', { name: 'Meio a Meio (Mussarela/Calabresa)' });
   // Console deve logar: "Pizza customizada adicionada: Meio a Meio (Mussarela/Calabresa)"

   // 3. Cancelar a inscrição
   unsub();

   // 4. Publicar novamente (não deve logar nada)
   EventBus.publish('pizza:adicionada', { name: 'Margarita' });
   ========================================================================== */
