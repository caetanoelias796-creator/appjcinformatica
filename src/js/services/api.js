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
    return {
      'sem-borda': { name: 'Sem Borda', price: 0.00, category: 'ambas' },
      'catupiry': { name: 'Borda de Catupiry', price: 5.00, category: 'salgadas' },
      'cheddar': { name: 'Borda de Cheddar', price: 5.00, category: 'salgadas' },
      'quatro-queijos': { name: 'Borda 4 Queijos', price: 5.00, category: 'salgadas' },
      'calabresa': { name: 'Borda de Calabresa', price: 5.00, category: 'salgadas' },
      'doce-de-leite': { name: 'Borda de Doce de Leite', price: 5.00, category: 'doces' },
      'choco-branco': { name: 'Borda de Chocolate Branco', price: 5.00, category: 'doces' },
      'choco-preto': { name: 'Borda de Chocolate Preto', price: 5.00, category: 'doces' },
      'gergelim': { name: 'Borda com Gergelim Branco', price: 5.00, category: 'ambas' }
    };
  }
  const res = await apiFetch('/api/menu');
  return res.borders;
}
