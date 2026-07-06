/**
 * PizzaFlow — ProductBuilder
 * Construtor fluente utilizando o design pattern Builder para configurações de produtos.
 */

export class ProductBuilder {
  constructor(product) {
    this.reset();
    if (product) {
      this.setProduct(product);
    }
  }

  /**
   * Reseta o estado do construtor
   * @returns {ProductBuilder}
   */
  reset() {
    this.product = null;
    this.size = null;
    this.flavors = [];
    this.crust = null;
    this.extras = [];
    this.quantity = 1;
    this.note = '';
    return this;
  }

  /**
   * Define o produto base
   * @param {object} product 
   * @returns {ProductBuilder}
   */
  setProduct(product) {
    this.product = product;
    // Por padrão inicializa sabores com o produto base
    if (this.flavors.length === 0) {
      this.flavors = [product];
    }
    return this;
  }

  /**
   * Define o tamanho
   * @param {object} size 
   * @returns {ProductBuilder}
   */
  setSize(size) {
    this.size = size;
    return this;
  }

  /**
   * Adiciona um sabor
   * @param {object} flavor 
   * @returns {ProductBuilder}
   */
  addFlavor(flavor) {
    if (!this.flavors.some(f => f.id === flavor.id)) {
      this.flavors.push(flavor);
    }
    return this;
  }

  /**
   * Remove um sabor
   * @param {string} flavorId 
   * @returns {ProductBuilder}
   */
  removeFlavor(flavorId) {
    this.flavors = this.flavors.filter(f => f.id !== flavorId);
    return this;
  }

  /**
   * Sobrescreve todos os sabores
   * @param {object[]} flavors 
   * @returns {ProductBuilder}
   */
  setFlavors(flavors) {
    this.flavors = [...flavors];
    return this;
  }

  /**
   * Define a borda recheada
   * @param {object} crust 
   * @returns {ProductBuilder}
   */
  setCrust(crust) {
    this.crust = crust;
    return this;
  }

  /**
   * Adiciona um ingrediente extra
   * @param {object} extra 
   * @returns {ProductBuilder}
   */
  addExtra(extra) {
    if (!this.extras.some(e => e.id === extra.id)) {
      this.extras.push(extra);
    }
    return this;
  }

  /**
   * Remove um ingrediente extra
   * @param {string} extraId 
   * @returns {ProductBuilder}
   */
  removeExtra(extraId) {
    this.extras = this.extras.filter(e => e.id !== extraId);
    return this;
  }

  /**
   * Sobrescreve todos os extras
   * @param {object[]} extras 
   * @returns {ProductBuilder}
   */
  setExtras(extras) {
    this.extras = [...extras];
    return this;
  }

  /**
   * Define a quantidade
   * @param {number} qty 
   * @returns {ProductBuilder}
   */
  setQuantity(qty) {
    this.quantity = Math.max(1, qty);
    return this;
  }

  /**
   * Define observações do preparo
   * @param {string} note 
   * @returns {ProductBuilder}
   */
  setNote(note) {
    this.note = note;
    return this;
  }

  /**
   * Define observações do preparo (apelido/alias para setNote)
   * @param {string} note 
   * @returns {ProductBuilder}
   */
  setObservation(note) {
    return this.setNote(note);
  }

  /**
   * Consolida e retorna o produto construído
   * @returns {object} Configuração do produto final
   */
  build() {
    if (!this.product) {
      throw new Error('Produto base é obrigatório para construir uma configuração.');
    }
    return {
      id: this.product.id,
      name: this.flavors.length > 1 
        ? `Pizza Meio a Meio (${this.flavors.map(f => f.name).join(' / ')})` 
        : this.product.name,
      image: this.product.image,
      product: this.product,
      size: this.size,
      flavors: [...this.flavors],
      crust: this.crust,
      extras: [...this.extras],
      quantity: this.quantity,
      note: this.note
    };
  }
}

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   const pizzaBase = { id: 'mussarela', name: 'Pizza Mussarela', image: 'mussarela.jpg' };
   const sabor2 = { id: 'calabresa', name: 'Pizza Calabresa' };
   const tamanhoM = { id: 'media', label: 'Média', price: 82.00 };
   const bordaCatupiry = { id: 'catupiry', name: 'Borda de Catupiry', price: 5.00 };

   const builder = new ProductBuilder();
   const pizzaConfig = builder
     .reset()
     .setProduct(pizzaBase)
     .setSize(tamanhoM)
     .addFlavor(sabor2)
     .setCrust(bordaCatupiry)
     .setQuantity(2)
     .setNote('Sem cebola')
     .build();

   console.log(pizzaConfig.name); // Deve imprimir: "Pizza Meio a Meio (Pizza Mussarela / Pizza Calabresa)"
   console.log(pizzaConfig.quantity); // Deve imprimir: 2
   ========================================================================== */
