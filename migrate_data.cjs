const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const appJsPath = 'E:\\Elias\\site 2\\app.js';
const targetMockDataPath = 'E:\\Elias\\APP-20260704T224315Z-3-001\\APP\\PizzaFlow\\frontend\\src\\js\\data\\mockData.js';
const targetMenuJsonPath = 'E:\\Elias\\mudo da Pizza\\menu.json';

function runMigration() {
  console.log('📖 Carregando app.js original de E:\\Elias\\site 2...');
  if (!fs.existsSync(appJsPath)) {
    console.error('❌ E:\\Elias\\site 2\\app.js não foi encontrado.');
    return;
  }

  const code = fs.readFileSync(appJsPath, 'utf8');

  // 1. Extrai MENU_ITEMS
  const startMenuItems = code.indexOf('let MENU_ITEMS = {');
  let braceCount = 0;
  let endMenuItems = -1;
  for (let i = startMenuItems; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
    } else if (code[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endMenuItems = i + 1;
        break;
      }
    }
  }

  // 2. Extrai BORDAS
  const startBordas = code.indexOf('let BORDAS = {');
  let braceCountB = 0;
  let endBordas = -1;
  for (let i = startBordas; i < code.length; i++) {
    if (code[i] === '{') {
      braceCountB++;
    } else if (code[i] === '}') {
      braceCountB--;
      if (braceCountB === 0) {
        endBordas = i + 1;
        break;
      }
    }
  }

  if (endMenuItems === -1 || endBordas === -1) {
    console.error('❌ Falha ao encontrar MENU_ITEMS ou BORDAS no app.js.');
    return;
  }

  const menuItemsCode = code.substring(startMenuItems, endMenuItems);
  const bordasCode = code.substring(startBordas, endBordas);

  const sandbox = {};
  eval(menuItemsCode + '; sandbox.MENU_ITEMS = MENU_ITEMS;');
  eval(bordasCode + '; sandbox.BORDAS = BORDAS;');

  const MENU_ITEMS = sandbox.MENU_ITEMS;
  const BORDAS = sandbox.BORDAS;

  const { pizzas, bebidas, lanches, acais } = MENU_ITEMS;

  console.log('🍕 Pizzas:', pizzas ? pizzas.length : 0);
  console.log('🥤 Bebidas:', bebidas ? bebidas.length : 0);
  console.log('🍔 Lanches:', lanches ? lanches.length : 0);
  console.log('🍧 Açaís:', acais ? acais.length : 0);

  const mappedProducts = [];

  // Mapeia Pizzas (PWA format)
  if (pizzas) {
    pizzas.forEach((p) => {
      const catType = p.categoryType || 'tradicional';
      const pricesObj = p.prices || { B: 50, M: 80, G: 110, F: 150 };

      // Mapeia tamanhos
      const sizes = [];
      if (pricesObj.B !== undefined) sizes.push({ id: 'broto', label: 'Brotinho (20cm)', price: parseFloat(pricesObj.B) });
      if (pricesObj.M !== undefined) sizes.push({ id: 'media', label: 'Média (25cm)', price: parseFloat(pricesObj.M) });
      if (pricesObj.G !== undefined) sizes.push({ id: 'grande', label: 'Grande (35cm)', price: parseFloat(pricesObj.G) });
      if (pricesObj.F !== undefined) sizes.push({ id: 'trem', label: 'Família (40cm)', price: parseFloat(pricesObj.F) });

      let category = 'pizza-classica';
      if (p.category === 'doces') {
        category = 'sobremesas';
      } else if (catType === 'especial' || catType === 'camarao') {
        category = 'pizza-especial';
      }

      // Preço de exibição é o preço da Média (ou o primeiro disponível)
      const defaultPrice = pricesObj.M !== undefined ? parseFloat(pricesObj.M) : (pricesObj.G !== undefined ? parseFloat(pricesObj.G) : 80);

      let image = p.image || '/assets/pizza_hero.png';
      if (image.startsWith('assets/')) image = '/' + image;
      else if (image.startsWith('imagens/')) image = '/' + image;

      const cleanDesc = p.description ? p.description.replace(/\.$/, '') : 'Molho e mussarela';
      const ingredients = cleanDesc.split(/, | e /)
        .map(i => i.trim())
        .filter(Boolean)
        .map(i => i.charAt(0).toUpperCase() + i.slice(1));

      const isBest = p.badge === 'Mais Pedida';
      const isPremium = p.badge === 'Premium' || p.badge === 'Doce Premium';
      const rating = isBest ? 4.9 : (isPremium ? 4.8 : parseFloat((4.4 + Math.random() * 0.4).toFixed(1)));
      const reviewCount = Math.floor(80 + Math.random() * 400);

      mappedProducts.push({
        id: p.id,
        name: p.name,
        slug: p.id,
        category: category,
        description: p.description || '',
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

  // Mapeia Lanches (PWA format)
  if (lanches) {
    lanches.forEach((l) => {
      let image = l.image || '/assets/lanche_xis.png';
      if (image.startsWith('assets/')) image = '/' + image;
      else if (image.startsWith('imagens/')) image = '/' + image;

      const cleanDesc = l.description ? l.description.replace(/\.$/, '') : 'Lanche delicioso';
      const ingredients = cleanDesc.split(/, | e /)
        .map(i => i.trim())
        .filter(Boolean)
        .map(i => i.charAt(0).toUpperCase() + i.slice(1));

      mappedProducts.push({
        id: l.id,
        name: l.name,
        slug: l.id,
        category: 'lanches',
        description: l.description || '',
        price: parseFloat(l.price) || 20,
        originalPrice: null,
        discount: null,
        image: image,
        rating: parseFloat((4.5 + Math.random() * 0.4).toFixed(1)),
        reviewCount: Math.floor(40 + Math.random() * 150),
        isBestSeller: l.id.includes('calabresa') || l.id.includes('tudo'),
        isNew: false,
        isFeatured: false,
        isAvailable: l.available !== undefined ? l.available : true,
        tags: [l.category || 'lanche'],
        sizes: [],
        ingredients: ingredients,
        prepTime: '15-20 min',
        calories: 780
      });
    });
  }

  // Mapeia Açaís (PWA format)
  if (acais) {
    acais.forEach((a) => {
      let image = a.image || '/assets/acai_hero.png';
      if (image.startsWith('assets/')) image = '/' + image;
      else if (image.startsWith('imagens/')) image = '/' + image;

      mappedProducts.push({
        id: a.id,
        name: a.name,
        slug: a.id,
        category: 'acais',
        description: a.description || '',
        price: parseFloat(a.price) || 15,
        originalPrice: null,
        discount: null,
        image: image,
        rating: 4.8,
        reviewCount: Math.floor(50 + Math.random() * 100),
        isBestSeller: true,
        isNew: false,
        isFeatured: true,
        isAvailable: a.available !== undefined ? a.available : true,
        tags: [a.size || 'Açaí'],
        sizes: [],
        ingredients: ['Açaí', 'Adicionais à escolha'],
        prepTime: '10 min',
        calories: 450
      });
    });
  }

  // Mapeia Bebidas (PWA format)
  if (bebidas) {
    bebidas.forEach((b) => {
      let image = b.image || '/assets/gourmet_bebida.png';
      if (image.startsWith('assets/')) image = '/' + image;
      else if (image.startsWith('imagens/')) image = '/' + image;

      mappedProducts.push({
        id: b.id,
        name: b.name,
        slug: b.id,
        category: 'bebidas',
        description: b.description || 'Bebida bem gelada.',
        price: parseFloat(b.price) || 6.0,
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

  // Estatísticas de Categorias PWA
  const categoriesCount = [
    { id: 'all',            label: 'Todas',          icon: '🍕', count: mappedProducts.length },
    { id: 'pizza-classica', label: 'Clássicas',       icon: '🫓', count: mappedProducts.filter(p => p.category === 'pizza-classica').length },
    { id: 'pizza-especial', label: 'Especiais',       icon: '⭐', count: mappedProducts.filter(p => p.category === 'pizza-especial').length },
    { id: 'sobremesas',     label: 'Doces',           icon: '🍮', count: mappedProducts.filter(p => p.category === 'sobremesas').length },
    { id: 'lanches',        label: 'Lanches',         icon: '🍔', count: mappedProducts.filter(p => p.category === 'lanches').length },
    { id: 'acais',          label: 'Açaís',           icon: '🍧', count: mappedProducts.filter(p => p.category === 'acais').length },
    { id: 'bebidas',        label: 'Bebidas',         icon: '🥤', count: mappedProducts.filter(p => p.category === 'bebidas').length },
  ];

  const bestSellerIds = mappedProducts.filter(p => p.isBestSeller).map(p => p.id).slice(0, 8);
  const recommendedIds = mappedProducts.filter(p => p.isFeatured && !p.isBestSeller).map(p => p.id).slice(0, 6);
  const upsellProductIds = mappedProducts.filter(p => p.category === 'bebidas' || p.category === 'sobremesas').map(p => p.id).slice(0, 6);

  const banners = [
    {
      id: 'b1',
      image: '/assets/banner_pizza_combo.png',
      imageAlt: 'Combo Promocional',
      tag: 'COMBO DO DIA',
      title: 'Pizza Calabresa M\\n+ Refrigerante Lata',
      subtitle: 'Aproveite nossa oferta especial!',
      buttonText: 'Aproveitar',
      buttonAction: 'route',
      buttonTarget: '#product/calabresa'
    },
    {
      id: 'b2',
      image: '/assets/banner_pizzas_doces.png',
      imageAlt: 'Pizzas Doces Premium',
      tag: 'DOCE DESTAQUE',
      title: 'Kinder Bueno e\\nEstikadinho Premium',
      subtitle: 'As pizzas doces mais desejadas!',
      buttonText: 'Ver Cardápio',
      buttonAction: 'route',
      buttonTarget: '#catalog'
    }
  ];

  const promotions = [
    {
      id: 'p1',
      title: 'Calabresa Mais Pedida',
      description: 'Molho, mussarela, calabresa e orégano.',
      discount: 15,
      gradient: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
      emoji: '🔥',
      buttonTarget: '#product/calabresa'
    },
    {
      id: 'p2',
      title: 'Xis Salada Completo',
      description: 'Hambúrguer de verdade com queijo derretido e fritas.',
      discount: 10,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      emoji: '🍔',
      buttonTarget: '#product/xis_salada'
    }
  ];

  // 3. Escreve mockData.js
  const mockDataContent = `/**
 * PizzaFlow — Mock Data (MIGRADO DE SITE 2 - PIZZARIA DRILL COMPLETA)
 * Gerado automaticamente através do script de migração.
 */

export const categories = ${JSON.stringify(categoriesCount, null, 2)};

export const products = ${JSON.stringify(mappedProducts, null, 2)};

export const banners = ${JSON.stringify(banners, null, 2)};

export const promotions = ${JSON.stringify(promotions, null, 2)};

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

  fs.writeFileSync(targetMockDataPath, mockDataContent, 'utf8');
  console.log('✅ mockData.js gravado com sucesso na pasta do novo app.');

  // 4. Escreve menu.json no formato esperado pelo backend
  const menuJsonContent = {
    menu_items: MENU_ITEMS,
    borders: BORDAS,
    promo_config: {
      show_popup: true,
      facebook_url: ""
    }
  };

  fs.writeFileSync(targetMenuJsonPath, JSON.stringify(menuJsonContent, null, 2), 'utf8');
  console.log('✅ menu.json gravado com sucesso na pasta mudo da Pizza.');

  console.log('🎉 Migração finalizada! Total de', mappedProducts.length, 'itens migrados.');
}

runMigration();
