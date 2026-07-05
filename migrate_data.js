const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const menuJsonPath = 'E:\\Elias\\mudo da Pizza\\menu.json';
const targetMockDataPath = 'E:\\Elias\\APP-20260704T224315Z-3-001\\APP\\PizzaFlow\\frontend\\src\\js\\data\\mockData.js';

function migrate() {
  console.log('📖 Carregando menu.json original...');
  if (!fs.existsSync(menuJsonPath)) {
    console.error('❌ menu.json não foi encontrado em:', menuJsonPath);
    return;
  }

  const data = JSON.parse(fs.readFileSync(menuJsonPath, 'utf8'));
  const { pizzas, bebidas } = data.menu_items;
  const pizzaPrices = data.pizza_prices;

  console.log('🍕 Pizzas encontradas:', pizzas ? pizzas.length : 0);
  console.log('🥤 Bebidas encontradas:', bebidas ? bebidas.length : 0);

  const mappedProducts = [];

  // Mapeia Pizzas
  if (pizzas) {
    pizzas.forEach((p) => {
      const catType = p.categoryType || 'tradicional';
      const prices = pizzaPrices.grande ? pizzaPrices : {
        // Fallback caso estrutura mude
        media: { promocional: 75, tradicional: 80, especial: 85, camarao: 90 },
        grande: { promocional: 90, tradicional: 100, especial: 110, camarao: 115 }
      };

      // Mapeia tamanhos
      const sizes = [
        { id: 'broto', label: 'Brotinho (20cm)', price: (pizzaPrices.broto ? pizzaPrices.broto[catType] : 50) },
        { id: 'media', label: 'Média (25cm)', price: (pizzaPrices.media ? pizzaPrices.media[catType] : 80) },
        { id: 'grande', label: 'Grande (35cm)', price: (pizzaPrices.grande ? pizzaPrices.grande[catType] : 110) },
        { id: 'vulcao', label: 'Borda Vulcão (35cm)', price: (pizzaPrices.vulcao ? pizzaPrices.vulcao[catType] : 110) },
        { id: 'trem', label: 'Trem (40cm)', price: (pizzaPrices.trem ? pizzaPrices.trem[catType] : 160) }
      ];

      // Categoria do novo app
      let category = 'pizza-classica';
      if (p.category === 'doces') {
        category = 'sobremesas';
      } else if (catType === 'especial' || catType === 'camarao') {
        category = 'pizza-especial';
      }

      // Preço de exibição é o preço da Média
      const defaultPrice = pizzaPrices.media ? pizzaPrices.media[catType] : 80;

      // Formata caminhos de imagens locais para funcionar no Vite (iniciando com /)
      let image = p.image || '/assets/pizza_hero.png';
      if (image.startsWith('assets/')) {
        image = '/' + image;
      } else if (image.startsWith('imagens/')) {
        image = '/' + image;
      }

      // Converte descrição em array de ingredientes
      const cleanDesc = p.description ? p.description.replace(/\.$/, '') : 'Molho e mussarela';
      const ingredients = cleanDesc.split(/, | e /)
        .map(i => i.trim())
        .filter(Boolean)
        .map(i => i.charAt(0).toUpperCase() + i.slice(1));

      // Ratings e Avaliações fictícias elegantes
      const isBest = p.badge === 'Mais Pedida';
      const isPremium = p.badge === 'Premium' || p.badge === 'Doce Premium';
      const rating = isBest ? 4.9 : (isPremium ? 4.8 : parseFloat((4.4 + Math.random() * 0.4).toFixed(1)));
      const reviewCount = Math.floor(80 + Math.random() * 400);

      mappedProducts.push({
        id: p.id,
        name: p.name,
        slug: p.id,
        category: category,
        description: p.description,
        price: defaultPrice,
        originalPrice: isBest ? defaultPrice + 12.00 : null,
        discount: isBest ? 15 : null,
        image: image,
        rating: rating,
        reviewCount: reviewCount,
        isBestSeller: isBest,
        isNew: p.badge === 'Novo' || p.badge === 'Doce Premium',
        isFeatured: isBest || isPremium,
        isAvailable: p.available !== undefined ? p.available : true,
        tags: p.badge ? [p.badge] : [],
        sizes: sizes,
        ingredients: ingredients,
        prepTime: '25-35 min',
        calories: 920
      });
    });
  }

  // Mapeia Bebidas
  if (bebidas) {
    bebidas.forEach((b) => {
      let image = b.image || '/assets/gourmet_bebida.png';
      if (image.startsWith('assets/')) {
        image = '/' + image;
      }

      mappedProducts.push({
        id: b.id,
        name: b.name,
        slug: b.id,
        category: 'bebidas',
        description: b.description || 'Bebida bem gelada.',
        price: b.price || 6.0,
        originalPrice: null,
        discount: null,
        image: image,
        rating: 4.8,
        reviewCount: 140,
        isBestSeller: b.id.includes('coca'),
        isNew: false,
        isFeatured: false,
        isAvailable: b.available !== undefined ? b.available : true,
        tags: ['bebida'],
        sizes: [],
        ingredients: ['Gelado'],
        prepTime: '2 min',
        calories: 140
      });
    });
  }

  // Estatísticas de Categorias
  const categories = [
    { id: 'all',            label: 'Todas',          icon: '🍕', count: mappedProducts.length },
    { id: 'pizza-classica', label: 'Clássicas',       icon: '🫓', count: mappedProducts.filter(p => p.category === 'pizza-classica').length },
    { id: 'pizza-especial', label: 'Especiais',       icon: '⭐', count: mappedProducts.filter(p => p.category === 'pizza-especial').length },
    { id: 'bebidas',        label: 'Bebidas',         icon: '🥤', count: mappedProducts.filter(p => p.category === 'bebidas').length },
    { id: 'sobremesas',     label: 'Doces',           icon: '🍮', count: mappedProducts.filter(p => p.category === 'sobremesas').length },
  ];

  // Identificadores para seções especiais da Home
  const bestSellerIds = mappedProducts.filter(p => p.isBestSeller).map(p => p.id).slice(0, 5);
  const recommendedIds = mappedProducts.filter(p => p.isFeatured && !p.isBestSeller).map(p => p.id).slice(0, 4);
  
  // Se não houver recomendadas suficientes, pega as primeiras doces
  if (recommendedIds.length < 4) {
    const doces = mappedProducts.filter(p => p.category === 'sobremesas').map(p => p.id);
    doces.forEach(id => {
      if (recommendedIds.length < 4 && !recommendedIds.includes(id)) {
        recommendedIds.push(id);
      }
    });
  }

  const upsellProductIds = mappedProducts.filter(p => p.category === 'bebidas' || p.category === 'sobremesas').map(p => p.id).slice(0, 4);

  // Escreve o mockData.js como módulo ES
  const fileContent = `/**
 * PizzaFlow — Mock Data (MIGRADO DA PIZZARIA DRILL)
 * Gerado automaticamente através do script de migração.
 */

export const categories = ${JSON.stringify(categories, null, 2)};

export const products = ${JSON.stringify(mappedProducts, null, 2)};

export const upsellProductIds = ${JSON.stringify(upsellProductIds, null, 2)};

export const bestSellerIds = ${JSON.stringify(bestSellerIds, null, 2)};

export const recommendedIds = ${JSON.stringify(recommendedIds, null, 2)};

export function getProductById(id) {
  return products.find(p => p.id === id);
}

export function getProductsByCategory(categoryId) {
  if (categoryId === 'all') return products;
  return products.filter(p => p.category === categoryId);
}

export function searchProducts(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.tags.some(tag => tag.toLowerCase().includes(q)) ||
    p.ingredients.some(ing => ing.toLowerCase().includes(q))
  );
}

export function getProductsByIds(ids) {
  return ids.map(id => getProductById(id)).filter(Boolean);
}

export function formatPrice(price) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
`;

  fs.writeFileSync(targetMockDataPath, fileContent, 'utf8');
  console.log('🎉 Migração concluída com sucesso! mockData.js gravado.');
}

migrate();
