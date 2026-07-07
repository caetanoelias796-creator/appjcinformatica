/**
 * PizzaFlow — API Service
 * Camada de serviço para comunicação com backend.
 * Atualmente usa dados mock; pronto para integração com API REST real.
 */

import {
  products,
  categories,
  banners,
  promotions,
  getProductById,
  getProductsByCategory,
  searchProducts,
  flavors,
  borders,
  extras,
  mockBusinessHours,
  mockRecentOrders,
} from '@data/mockData.js';
import { sleep } from '@utils/helpers.js';

/* ==========================================================================
   CONFIGURAÇÃO
   ========================================================================== */

/** URL base da API (vazia em modo mock) */
const API_BASE = import.meta.env.VITE_API_URL || '';

/** Simular latência de rede em modo development */
const MOCK_DELAY = 300; // ms

/** Flag para usar dados mock ou API real (se VITE_API_URL estiver definida) */
const USE_MOCK = !import.meta.env.VITE_API_URL;

/* ==========================================================================
   UTILITÁRIO INTERNO
   ========================================================================== */

/**
 * Wrapper de fetch com tratamento de erros padronizado
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Resposta mock com delay simulado
 * @param {unknown} data
 * @returns {Promise<unknown>}
 */
async function mockResponse(data) {
  await sleep(MOCK_DELAY);
  return { success: true, data };
}

/* ==========================================================================
   PRODUTOS API
   ========================================================================== */

/**
 * Busca todos os produtos
 * @returns {Promise<Product[]>}
 */
export async function fetchProducts() {
  if (USE_MOCK) {
    const res = await mockResponse(products);
    return res.data;
  }
  const res = await apiFetch('/api/products');
  return res.data;
}

/**
 * Busca produto por ID
 * @param {string} id
 * @returns {Promise<Product>}
 */
export async function fetchProduct(id) {
  if (USE_MOCK) {
    const product = getProductById(id);
    if (!product) throw new Error(`Produto "${id}" não encontrado`);
    const res = await mockResponse(product);
    return res.data;
  }
  const res = await apiFetch(`/api/products/${id}`);
  return res.data;
}

/**
 * Busca produtos por categoria
 * @param {string} categoryId
 * @returns {Promise<Product[]>}
 */
export async function fetchProductsByCategory(categoryId) {
  if (USE_MOCK) {
    const result = getProductsByCategory(categoryId);
    const res = await mockResponse(result);
    return res.data;
  }
  const res = await apiFetch(`/api/products?category=${categoryId}`);
  return res.data;
}

/**
 * Pesquisa produtos
 * @param {string} query
 * @returns {Promise<Product[]>}
 */
export async function fetchSearchResults(query) {
  if (USE_MOCK) {
    const result = searchProducts(query);
    const res = await mockResponse(result);
    return res.data;
  }
  const res = await apiFetch(`/api/products/search?q=${encodeURIComponent(query)}`);
  return res.data;
}

/* ==========================================================================
   CATEGORIAS API
   ========================================================================== */

/**
 * Busca todas as categorias
 * @returns {Promise<Category[]>}
 */
export async function fetchCategories() {
  if (USE_MOCK) {
    const res = await mockResponse(categories);
    return res.data;
  }
  const res = await apiFetch('/api/categories');
  return res.data;
}

/* ==========================================================================
   BANNERS API
   ========================================================================== */

/**
 * Busca banners ativos
 * @returns {Promise<Banner[]>}
 */
export async function fetchBanners() {
  if (USE_MOCK) {
    const res = await mockResponse(banners);
    return res.data;
  }
  const res = await apiFetch('/api/banners');
  return res.data;
}

/* ==========================================================================
   PROMOÇÕES API
   ========================================================================== */

/**
 * Busca promoções ativas
 * @returns {Promise<Promo[]>}
 */
export async function fetchPromotions() {
  if (USE_MOCK) {
    const res = await mockResponse(promotions);
    return res.data;
  }
  const res = await apiFetch('/api/promotions');
  return res.data;
}

/* ==========================================================================
   PEDIDOS API
   ========================================================================== */

/**
 * Cria um novo pedido
 * @param {{ items: CartItem[], address: string, paymentMethod: string }} orderData
 * @returns {Promise<Order>}
 */
export async function createOrder(orderData) {
  if (USE_MOCK) {
    const order = {
      id: `ORD-${Date.now()}`,
      ...orderData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      estimatedDelivery: '35–45 min',
    };
    const res = await mockResponse(order);
    return res.data;
  }
  const res = await apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  return res.data;
}

/**
 * Busca pedidos do usuário
 * @returns {Promise<Order[]>}
 */
export async function fetchOrders() {
  if (USE_MOCK) {
    const res = await mockResponse([]);
    return res.data;
  }
  const res = await apiFetch('/api/orders');
  return res.data;
}

/**
 * Busca todas as bordas recheadas
 * @returns {Promise<Record<string, { name: string, price: number, category: string }>>}
 */
export async function fetchBorders() {
  if (USE_MOCK) {
    const record = {};
    borders.forEach(b => {
      record[b.id] = { name: b.name, price: b.price, category: b.category };
    });
    return record;
  }
  const res = await apiFetch('/api/menu');
  return res.borders;
}

/**
 * Busca todos os adicionais/extras
 * @returns {Promise<Extra[]>}
 */
export async function fetchExtras() {
  if (USE_MOCK) {
    return extras;
  }
  const res = await apiFetch('/api/extras');
  return res.data;
}

/**
 * Busca produtos de forma paginada para o painel administrativo
 * @param {object} filters
 * @returns {Promise<{ items: Product[], total: number, page: number, limit: number, pages: number }>}
 */
export async function fetchAdminProducts(filters = {}) {
  if (USE_MOCK) {
    let result = [...products];

    // Filtro por categoria
    if (filters.categoryId && filters.categoryId !== 'all') {
      result = result.filter(p => p.category === filters.categoryId || p.categoryId === filters.categoryId);
    }

    // Filtro por busca
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filtro por ativo/inativo
    if (filters.active !== undefined) {
      result = result.filter(p => p.isAvailable === filters.active || p.active === filters.active);
    }

    const page = parseInt(filters.page || 1, 10);
    const limit = parseInt(filters.limit || 10, 10);
    const skip = (page - 1) * limit;
    const paginated = result.slice(skip, skip + limit);

    const res = await mockResponse({
      items: paginated.map(p => ({
        ...p,
        active: p.isAvailable ?? p.active ?? true, // mapeia disponibilidade
      })),
      total: result.length,
      page,
      limit,
      pages: Math.ceil(result.length / limit)
    });
    return res.data;
  }

  const queryParams = new URLSearchParams();
  if (filters.companyId) queryParams.append('companyId', filters.companyId);
  if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.active !== undefined) queryParams.append('active', filters.active);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const res = await apiFetch(`/api/products?${queryParams.toString()}`);
  return {
    items: res.data || [],
    total: res.meta?.total || (res.data || []).length,
    page: res.meta?.page || 1,
    limit: res.meta?.limit || 10,
    pages: res.meta?.pages || 1
  };
}

/**
 * Cadastra um novo produto
 * @param {object} productData
 * @returns {Promise<Product>}
 */
export async function createProduct(productData) {
  if (USE_MOCK) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      slug: productData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      category: productData.categoryId, // mapeia id no mock
      categoryId: productData.categoryId,
      description: productData.description || '',
      image: productData.image || '/assets/pizza_hero.png',
      type: productData.type || 'PIZZA',
      price: productData.sizes?.[0]?.price || 0, // preço base
      rating: 5.0,
      reviewCount: 0,
      isAvailable: productData.active ?? true,
      active: productData.active ?? true,
      tags: [],
      ingredients: [],
      sizes: productData.sizes.map((s, idx) => ({
        id: s.id || `size-${idx}-${Date.now()}`,
        name: s.name,
        price: parseFloat(s.price),
        maxFlavors: s.maxFlavors || 1,
        order: s.order || 0
      }))
    };
    products.unshift(newProduct); // Adiciona no início
    const res = await mockResponse(newProduct);
    return res.data;
  }

  const res = await apiFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  return res.data;
}

/**
 * Atualiza um produto existente
 * @param {string} id
 * @param {object} productData
 * @returns {Promise<Product>}
 */
export async function updateProduct(id, productData) {
  if (USE_MOCK) {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');

    const updated = {
      ...products[idx],
      name: productData.name ?? products[idx].name,
      description: productData.description ?? products[idx].description,
      image: productData.image ?? products[idx].image,
      category: productData.categoryId ?? products[idx].categoryId,
      categoryId: productData.categoryId ?? products[idx].categoryId,
      type: productData.type ?? products[idx].type,
      isAvailable: productData.active ?? products[idx].isAvailable,
      active: productData.active ?? products[idx].active,
      price: productData.sizes?.[0]?.price ?? products[idx].price,
      sizes: productData.sizes
        ? productData.sizes.map((s, idxS) => ({
            id: s.id || `size-${idxS}-${Date.now()}`,
            name: s.name,
            price: parseFloat(s.price),
            maxFlavors: s.maxFlavors || 1,
            order: s.order || 0,
            crustIds: s.crustIds || [],
            extraIds: s.extraIds || []
          }))
        : products[idx].sizes
    };

    products[idx] = updated;
    const res = await mockResponse(updated);
    return res.data;
  }

  const res = await apiFetch(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  });
  return res.data;
}

/**
 * Remove um produto
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteProduct(id) {
  if (USE_MOCK) {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');
    products.splice(idx, 1);
    await mockResponse(true);
    return true;
  }

  const res = await apiFetch(`/api/products/${id}`, {
    method: 'DELETE'
  });
  return res.success;
}

/**
 * Busca as categorias de forma paginada/filtrada para o painel
 * @param {object} filters
 * @returns {Promise<{ items: Category[], total: number, page: number, limit: number, pages: number }>}
 */
export async function fetchAdminCategories(filters = {}) {
  if (USE_MOCK) {
    let result = [...categories];

    // Remove a categoria virtual 'all' do mock para não aparecer no painel
    result = result.filter(c => c.id !== 'all');

    // Filtro por busca
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c =>
        c.label.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q))
      );
    }

    // Filtro por status ativo
    if (filters.active !== undefined) {
      result = result.filter(c => c.active === filters.active || (c.active === undefined && filters.active === true));
    }

    // Ordenação
    const sort = filters.sort || 'order';
    const order = filters.order || 'asc';
    result.sort((a, b) => {
      let valA, valB;
      if (sort === 'name') {
        valA = a.name || a.label;
        valB = b.name || b.label;
      } else if (sort === 'order') {
        valA = a.displayOrder ?? 0;
        valB = b.displayOrder ?? 0;
      } else if (sort === 'status') {
        valA = a.active !== false ? 1 : 0;
        valB = b.active !== false ? 1 : 0;
      } else {
        valA = a.id;
        valB = b.id;
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const page = parseInt(filters.page || 1, 10);
    const limit = parseInt(filters.limit || 10, 10);
    const skip = (page - 1) * limit;
    const paginated = result.slice(skip, skip + limit);

    const res = await mockResponse({
      items: paginated.map(c => ({
        ...c,
        name: c.name || c.label,
        active: c.active !== false,
        displayOrder: c.displayOrder || 0
      })),
      total: result.length,
      page,
      limit,
      pages: Math.ceil(result.length / limit)
    });
    return res.data;
  }

  const queryParams = new URLSearchParams();
  if (filters.companyId) queryParams.append('companyId', filters.companyId);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.active !== undefined) queryParams.append('active', filters.active);
  if (filters.sort) queryParams.append('sort', filters.sort);
  if (filters.order) queryParams.append('order', filters.order);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const res = await apiFetch(`/api/categories?${queryParams.toString()}`);
  return {
    items: res.data || [],
    total: res.meta?.total || (res.data || []).length,
    page: res.meta?.page || 1,
    limit: res.meta?.limit || 10,
    pages: res.meta?.pages || 1
  };
}

/**
 * Cadastra uma nova categoria
 * @param {object} data
 * @returns {Promise<Category>}
 */
export async function createCategory(data) {
  if (USE_MOCK) {
    const nameLower = data.name.toLowerCase();
    const exists = categories.some(c => (c.name || c.label).toLowerCase() === nameLower);
    if (exists) {
      throw new Error('Já existe uma categoria cadastrada com este nome nesta empresa.');
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      label: data.name,
      name: data.name,
      slug: data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      icon: data.image || '📁',
      image: data.image || '',
      description: data.description || '',
      displayOrder: parseInt(data.displayOrder || 0, 10),
      active: data.active !== false,
      count: 0
    };

    categories.push(newCat);
    const res = await mockResponse(newCat);
    return res.data;
  }

  const res = await apiFetch('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Atualiza uma categoria existente
 * @param {string} id
 * @param {object} data
 * @returns {Promise<Category>}
 */
export async function updateCategory(id, data) {
  if (USE_MOCK) {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada');

    if (data.name && data.name.toLowerCase() !== (categories[idx].name || categories[idx].label).toLowerCase()) {
      const nameLower = data.name.toLowerCase();
      const exists = categories.some(c => c.id !== id && (c.name || c.label).toLowerCase() === nameLower);
      if (exists) {
        throw new Error('Já existe uma categoria cadastrada com este nome nesta empresa.');
      }
    }

    const updated = {
      ...categories[idx],
      name: data.name ?? categories[idx].name,
      label: data.name ?? categories[idx].label,
      description: data.description ?? categories[idx].description,
      image: data.image ?? categories[idx].image,
      icon: data.image ?? categories[idx].icon,
      displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : categories[idx].displayOrder,
      active: data.active !== undefined ? data.active : categories[idx].active
    };

    categories[idx] = updated;
    const res = await mockResponse(updated);
    return res.data;
  }

  const res = await apiFetch(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Remove uma categoria
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteCategory(id) {
  if (USE_MOCK) {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada');

    // Valida se há produtos vinculados
    const hasLinked = products.some(p => p.category === id || p.categoryId === id);
    if (hasLinked) {
      throw new Error('Não é possível excluir uma categoria que possui produtos vinculados.');
    }

    categories.splice(idx, 1);
    await mockResponse(true);
    return true;
  }

  const res = await apiFetch(`/api/categories/${id}`, {
    method: 'DELETE'
  });
  return res.success;
}

/**
 * Busca os sabores de forma paginada/filtrada para o painel
 * @param {object} filters
 * @returns {Promise<{ items: Flavor[], total: number, page: number, limit: number, pages: number }>}
 */
export async function fetchAdminFlavors(filters = {}) {
  if (USE_MOCK) {
    let result = [...flavors];

    // Filtro por busca
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    // Filtro por status ativo
    if (filters.active !== undefined) {
      result = result.filter(f => f.active === filters.active || (f.active === undefined && filters.active === true));
    }

    // Ordenação
    const sort = filters.sort || 'order';
    const order = filters.order || 'asc';
    result.sort((a, b) => {
      let valA, valB;
      if (sort === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sort === 'order') {
        valA = a.displayOrder ?? 0;
        valB = b.displayOrder ?? 0;
      } else if (sort === 'status') {
        valA = a.active !== false ? 1 : 0;
        valB = b.active !== false ? 1 : 0;
      } else {
        valA = a.id;
        valB = b.id;
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const page = parseInt(filters.page || 1, 10);
    const limit = parseInt(filters.limit || 10, 10);
    const skip = (page - 1) * limit;
    const paginated = result.slice(skip, skip + limit);

    const res = await mockResponse({
      items: paginated.map(f => ({
        ...f,
        active: f.active !== false,
        displayOrder: f.displayOrder || 0
      })),
      total: result.length,
      page,
      limit,
      pages: Math.ceil(result.length / limit)
    });
    return res.data;
  }

  const queryParams = new URLSearchParams();
  if (filters.companyId) queryParams.append('companyId', filters.companyId);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.active !== undefined) queryParams.append('active', filters.active);
  if (filters.sort) queryParams.append('sort', filters.sort);
  if (filters.order) queryParams.append('order', filters.order);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);

  const res = await apiFetch(`/api/flavors?${queryParams.toString()}`);
  return {
    items: res.data || [],
    total: res.meta?.total || (res.data || []).length,
    page: res.meta?.page || 1,
    limit: res.meta?.limit || 10,
    pages: res.meta?.pages || 1
  };
}

/**
 * Cadastra um novo sabor
 * @param {object} data
 * @returns {Promise<Flavor>}
 */
export async function createFlavor(data) {
  if (USE_MOCK) {
    const nameLower = data.name.toLowerCase();
    const exists = flavors.some(f => f.name.toLowerCase() === nameLower);
    if (exists) {
      throw new Error('Já existe um sabor cadastrado com este nome nesta empresa.');
    }

    const newFlavor = {
      id: `flavor-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      displayOrder: parseInt(data.displayOrder || 0, 10),
      active: data.active !== false,
      companyId: data.companyId
    };

    flavors.push(newFlavor);
    const res = await mockResponse(newFlavor);
    return res.data;
  }

  const res = await apiFetch('/api/flavors', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Atualiza um sabor existente
 * @param {string} id
 * @param {object} data
 * @returns {Promise<Flavor>}
 */
export async function updateFlavor(id, data) {
  if (USE_MOCK) {
    const idx = flavors.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Sabor não encontrado');

    if (data.name && data.name.toLowerCase() !== flavors[idx].name.toLowerCase()) {
      const nameLower = data.name.toLowerCase();
      const exists = flavors.some(f => f.id !== id && f.name.toLowerCase() === nameLower);
      if (exists) {
        throw new Error('Já existe um sabor cadastrado com este nome nesta empresa.');
      }
    }

    const updated = {
      ...flavors[idx],
      name: data.name ?? flavors[idx].name,
      description: data.description ?? flavors[idx].description,
      image: data.image ?? flavors[idx].image,
      displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : flavors[idx].displayOrder,
      active: data.active !== undefined ? data.active : flavors[idx].active
    };

    flavors[idx] = updated;
    const res = await mockResponse(updated);
    return res.data;
  }

  const res = await apiFetch(`/api/flavors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.data;
}

/**
 * Remove um sabor
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteFlavor(id) {
  if (USE_MOCK) {
    const idx = flavors.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Sabor não encontrado');

    flavors.splice(idx, 1);
    await mockResponse(true);
    return true;
  }

  const res = await apiFetch(`/api/flavors/${id}`, {
    method: 'DELETE'
  });
  return res.success;
}

/**
 * Busca métricas consolidadas do Dashboard
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function fetchDashboardMetrics(filters = {}) {
  if (USE_MOCK) {
    const now = new Date();
    const day = now.getDay();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const current = `${hours}:${minutes}`;

    const config = mockBusinessHours.find(h => h.dayOfWeek === day && h.active);
    let isOpen = false;
    if (config) {
      if (config.closeTime > config.openTime) {
        isOpen = current >= config.openTime && current <= config.closeTime;
      } else {
        isOpen = current >= config.openTime || current <= config.closeTime;
      }
    } else {
      isOpen = current >= '18:00' && current <= '23:30';
    }

    const res = await mockResponse({
      kpis: {
        todayOrdersCount: 28,
        todayRevenueSum: 2060.00,
        averageTicket: 73.57,
        averagePrepTime: 22,
        isOpen
      },
      productionCounts: {
        novos: 2,
        preparo: 3,
        forno: 1,
        prontos: 2,
        entrega: 4
      },
      recentOrders: mockRecentOrders
    });
    return res.data;
  }

  const queryParams = new URLSearchParams();
  if (filters.companyId) queryParams.append('companyId', filters.companyId);

  const res = await apiFetch(`/api/dashboard/metrics?${queryParams.toString()}`);
  return res.data;
}
