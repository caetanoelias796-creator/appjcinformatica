/**
 * PizzaFlow — PriceEngine
 * Engine central de precificação responsável por calcular subtotais, adicionais e valor total.
 */

export const PriceEngine = {
  /**
   * Calcula o preço detalhado de uma configuração de produto
   * @param {object} config - Configuração do produto vinda do ProductBuilder
   * @returns {{ subtotal: number, extras: number, borda: number, total: number }} Valores calculados
   */
  calculate(config) {
    const { product, size, flavors, crust, extras, quantity = 1 } = config;
    if (!product) return { subtotal: 0, extras: 0, borda: 0, total: 0 };

    // 1. Determina o preço base (maior valor entre os sabores para o tamanho selecionado)
    let basePrice = 0;
    if (flavors && flavors.length > 0 && size) {
      let maxPrice = 0;
      flavors.forEach(flv => {
        if (flv.sizes) {
          const sizeObj = flv.sizes.find(s => s.id === size.id);
          if (sizeObj && sizeObj.price > maxPrice) {
            maxPrice = sizeObj.price;
          }
        }
      });
      basePrice = maxPrice || size.price || product.price || 0;
    } else if (size) {
      basePrice = size.price || product.price || 0;
    } else {
      basePrice = product.price || 0;
    }

    // 2. Calcula adicionais (borda recheada e ingredientes extras)
    const borderUnitPrice = crust ? parseFloat(crust.price || 0) : 0;
    const extrasUnitPrice = extras ? extras.reduce((sum, item) => sum + parseFloat(item.price || 0), 0) : 0;

    // 3. Aplica quantidades
    const subtotal = basePrice * quantity;
    const bordaTotal = borderUnitPrice * quantity;
    const extrasTotal = extrasUnitPrice * quantity;
    const total = subtotal + bordaTotal + extrasTotal;

    return {
      subtotal,
      extras: extrasTotal,
      borda: bordaTotal,
      total
    };
  }
};

/* ==========================================================================
   TESTES BÁSICOS DE USO
   ==========================================================================
   
   const pizza1 = { id: 'mus', price: 40, sizes: [{ id: 'media', price: 80 }] };
   const pizza2 = { id: 'cal', price: 42, sizes: [{ id: 'media', price: 84 }] };
   const tamanhoM = { id: 'media', price: 80 };
   const bordaCatupiry = { id: 'catupiry', price: 5 };
   const extrasList = [{ id: 'bacon', price: 4.5 }, { id: 'cebola', price: 2 }];

   const config = {
     product: pizza1,
     size: tamanhoM,
     flavors: [pizza1, pizza2], // Meio a meio (84 será o preço base)
     crust: bordaCatupiry,
     extras: extrasList,
     quantity: 2
   };

   const result = PriceEngine.calculate(config);
   console.log(result.subtotal); // Deve imprimir: 168 (84 * 2)
   console.log(result.borda);    // Deve imprimir: 10 (5 * 2)
   console.log(result.extras);   // Deve imprimir: 13 (6.5 * 2)
   console.log(result.total);    // Deve imprimir: 191 (168 + 10 + 13)
   ========================================================================== */
