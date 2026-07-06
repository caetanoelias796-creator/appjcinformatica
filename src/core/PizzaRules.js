/**
 * PizzaFlow — PizzaRules
 * Centraliza e valida todas as regras de negócio de montagem e compatibilidade de pizzas.
 */

export const PizzaRules = {
  /**
   * Retorna o limite máximo de sabores permitido para o tamanho escolhido
   * @param {string} sizeId - ID do tamanho (broto, media, grande, trem/gigante)
   * @returns {number} Limite máximo de sabores
   */
  getMaxFlavors(sizeId) {
    if (sizeId === 'broto') return 1;
    if (sizeId === 'media') return 2;
    if (sizeId === 'grande') return 2;
    if (sizeId === 'trem' || sizeId === 'gigante') return 4;
    return 1;
  },

  /**
   * Retorna o limite máximo de sabores (apelido de getMaxFlavors aceitando objeto ou string)
   * @param {object|string} size - Objeto de tamanho ou string ID do tamanho
   * @returns {number}
   */
  maxFlavors(size) {
    const sizeId = size && typeof size === 'object' ? size.id : size;
    return this.getMaxFlavors(sizeId);
  },

  /**
   * Verifica se é possível adicionar mais um sabor
   * @param {object|string} size 
   * @param {number} currentFlavorsCount 
   * @returns {boolean}
   */
  canAddFlavor(size, currentFlavorsCount) {
    return currentFlavorsCount < this.maxFlavors(size);
  },

  /**
   * Retorna as bordas recheadas permitidas para a categoria ou tamanho
   * @param {string|object} categoryOrSize - Categoria do produto ou objeto de tamanho
   * @param {object} bordersList - Objeto contendo as bordas da base de dados
   * @returns {object[]} Lista de bordas compatíveis
   */
  allowedCrusts(categoryOrSize, bordersList) {
    if (!bordersList) return [];
    
    // Resolve categoria (se for objeto do produto base ou do tamanho)
    const category = categoryOrSize && typeof categoryOrSize === 'object' 
      ? (categoryOrSize.category || '') 
      : String(categoryOrSize || '');

    const isSweet = category === 'sobremesas' || category.includes('doce');
    
    return Object.entries(bordersList).map(([id, b]) => ({ id, ...b }))
      .filter(b => b.category === 'ambas' || (isSweet ? b.category === 'doces' : b.category === 'salgadas'));
  },

  /**
   * Retorna o limite máximo de ingredientes extras permitidos
   * @param {object|string} size 
   * @returns {number}
   */
  maxExtras(size) {
    return 99; // Sem limite prático para pizzas
  },

  /**
   * Verifica se uma borda recheada é compatível com a categoria do produto (salgada vs doce)
   * @param {string} productCategory - Categoria da pizza (pizza-classica, pizza-especial, sobremesas)
   * @param {object} crust - Objeto de borda recheada
   * @returns {boolean} Verdadeiro se for compatível
   */
  isCrustCompatible(productCategory, crust) {
    if (!crust || crust.id === 'sem-borda' || crust.category === 'ambas') return true;
    const isSweet = productCategory === 'sobremesas';
    if (isSweet) {
      return crust.category === 'doces';
    } else {
      return crust.category === 'salgadas';
    }
  },

  /**
   * Valida se uma configuração atende a todas as regras de negócio
   * @param {object} config - Configuração de pizza vinda do ProductBuilder
   * @returns {{ isValid: boolean, error?: string }} Resultado da validação
   */
  validate(config) {
    if (!config.product) {
      return { isValid: false, error: 'O produto base é obrigatório' };
    }
    
    if (!config.size) {
      return { isValid: false, error: 'O tamanho da pizza é obrigatório' };
    }

    if (!config.flavors || config.flavors.length === 0) {
      return { isValid: false, error: 'Selecione pelo menos um sabor para a pizza' };
    }

    // 1. Validação de limite de sabores
    const maxFlavors = this.getMaxFlavors(config.size.id);
    if (config.flavors.length > maxFlavors) {
      return { 
        isValid: false, 
        error: `O tamanho "${config.size.label || config.size.id}" aceita no máximo ${maxFlavors} ${maxFlavors === 1 ? 'sabor' : 'sabores'}` 
      };
    }

    // 2. Validação de compatibilidade de borda recheada
    if (config.crust && !this.isCrustCompatible(config.product.category, config.crust)) {
      return { 
        isValid: false, 
        error: `A borda recheada "${config.crust.name}" não é compatível com uma pizza de categoria "${config.product.category}"` 
      };
    }

    return { isValid: true };
  }
};

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   // Teste 1: Limite de Sabores
   console.log(PizzaRules.getMaxFlavors('media')); // Deve imprimir: 2
   console.log(PizzaRules.getMaxFlavors('broto')); // Deve imprimir: 1

   // Teste 2: Validação de compatibilidade de Borda Doce
   const bordaDoce = { id: 'choco', name: 'Borda de Chocolate', category: 'doces' };
   const ehCompativel = PizzaRules.isCrustCompatible('pizza-classica', bordaDoce);
   console.log(ehCompativel); // Deve imprimir: false (borda doce em pizza salgada)

   // Teste 3: Validação de configuração inválida
   const configInvalida = {
     product: { category: 'pizza-classica' },
     size: { id: 'broto', label: 'Brotinho' },
     flavors: [{ id: 'mus' }, { id: 'cal' }] // 2 sabores no broto
   };
   const result = PizzaRules.validate(configInvalida);
   console.log(result.isValid); // Deve imprimir: false
   console.log(result.error); // Deve imprimir erro correspondente ao limite de sabores
   ========================================================================== */
