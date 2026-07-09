/**
 * PizzaFlow — API Facade Service
 * 
 * Este arquivo atua como uma Fachada (Facade Design Pattern). Ele redireciona todas 
 * as chamadas de dados do frontend para a nova camada de serviços desacoplada (Firebase/Mock).
 * 
 * Vantagem: Nenhuma tela do aplicativo precisa ser alterada, mantendo o layout
 * e o funcionamento visual blindados de bugs de migração.
 */

import { ProductService } from './ProductService.js';
import { CategoryService } from './CategoryService.js';
import { FlavorService } from './FlavorService.js';
import { OrderService } from './OrderService.js';
import { DashboardService } from './DashboardService.js';

import {
  banners as mockBanners,
  promotions as mockPromotions,
  borders as mockBorders,
  extras as mockExtras
} from '@data/mockData.js';

/* ==========================================================================
   PRODUTOS API
   ========================================================================== */

export async function fetchProducts() {
  return ProductService.getProducts();
}

export async function fetchProduct(id) {
  return ProductService.getProductById(id);
}

export async function fetchProductsByCategory(categoryId) {
  return ProductService.getProductsByCategory(categoryId);
}

export async function fetchSearchResults(query) {
  return ProductService.searchProducts(query);
}

export async function fetchAdminProducts(filters = {}) {
  return ProductService.getAdminProducts(filters);
}

export async function createProduct(productData) {
  return ProductService.createProduct(productData);
}

export async function updateProduct(id, productData) {
  return ProductService.updateProduct(id, productData);
}

export async function deleteProduct(id) {
  return ProductService.deleteProduct(id);
}

/* ==========================================================================
   CATEGORIAS API
   ========================================================================== */

export async function fetchCategories() {
  return CategoryService.getCategories();
}

export async function fetchAdminCategories(filters = {}) {
  return CategoryService.getAdminCategories(filters);
}

export async function createCategory(data) {
  return CategoryService.createCategory(data);
}

export async function updateCategory(id, data) {
  return CategoryService.updateCategory(id, data);
}

export async function deleteCategory(id) {
  return CategoryService.deleteCategory(id);
}

/* ==========================================================================
   SABORES API
   ========================================================================== */

export async function fetchAdminFlavors(filters = {}) {
  return FlavorService.getAdminFlavors(filters);
}

export async function createFlavor(data) {
  return FlavorService.createFlavor(data);
}

export async function updateFlavor(id, data) {
  return FlavorService.updateFlavor(id, data);
}

export async function deleteFlavor(id) {
  return FlavorService.deleteFlavor(id);
}

/* ==========================================================================
   PEDIDOS API
   ========================================================================== */

export async function createOrder(orderData) {
  return OrderService.createOrder(orderData);
}

export async function fetchOrders(filters = {}) {
  return OrderService.getOrders(filters);
}

export async function updateOrderStatus(orderId, status) {
  return OrderService.updateOrderStatus(orderId, status);
}

/* ==========================================================================
   DASHBOARD API
   ========================================================================== */

export async function fetchDashboardMetrics(filters = {}) {
  return DashboardService.getDashboardMetrics(filters);
}

/* ==========================================================================
   BANNERS, PROMOÇÕES, BORDAS & ADICIONAIS (ESTÁTICOS / FALLBACKS)
   ========================================================================== */

export async function fetchBanners() {
  return mockBanners;
}

export async function fetchPromotions() {
  return mockPromotions;
}

export async function fetchBorders() {
  const record = {};
  mockBorders.forEach(b => {
    record[b.id] = { name: b.name, price: b.price, category: b.category };
  });
  return record;
}

export async function fetchExtras() {
  return mockExtras;
}
