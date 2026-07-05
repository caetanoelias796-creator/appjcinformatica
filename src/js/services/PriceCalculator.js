/**
 * PizzaFlow — Price Calculator Service
 * Serviço especializado para cálculo de preços de pizzas customizadas.
 */

/**
 * Calcula o preço de um item configurado
 * @param {object} product - Produto base
 * @param {object} size - Tamanho selecionado (ex: { id: 'media', price: 80 })
 * @param {object[]} flavors - Lista de sabores selecionados (objetos de produtos)
 * @param {object[]} extras - Lista de extras selecionados (ex: [{ id: 'bacon', price: 4.50 }])
 * @param {object} [crust] - Borda selecionada (ex: { id: 'catupiry', price: 5.00 })
 * @param {number} [quantity=1] - Quantidade de itens
 * @returns {{ subtotal: number, extras: number, borda: number, total: number }}
 */
export function calculatePrice(product, size, flavors, extras, crust, quantity = 1) {
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
    // Se nenhum sabor tiver preço para esse tamanho, usa o preço do tamanho padrão do produto base
    basePrice = maxPrice || size.price || product.price || 0;
  } else if (size) {
    basePrice = size.price || product.price || 0;
  } else {
    basePrice = product.price || 0;
  }

  // 2. Calcula adicionais de borda e extras
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
