/**
 * PizzaFlow — OrderService
 * Camada de serviço de persistência de pedidos integrada ao Firestore.
 */

import { db, isFirebaseActive, withTimeout } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  addDoc,
  updateDoc, 
  query, 
  orderBy,
  limit as limitQuery
} from 'firebase/firestore';

const LOCAL_ORDERS_KEY = 'pizzaflow_local_orders';

// Função para recuperar pedidos locais (Modo Mock)
function getLocalOrders() {
  try {
    const data = localStorage.getItem(LOCAL_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Erro ao ler pedidos locais:', err);
    return [];
  }
}

// Função para salvar pedidos locais (Modo Mock)
function saveLocalOrders(orders) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Erro ao salvar pedidos locais:', err);
  }
}

export const OrderService = {
  /**
   * Cria um novo pedido
   */
  async createOrder(orderData) {
    const orderId = `ORD-${Date.now()}`;
    const newOrder = {
      id: orderId,
      ...orderData,
      status: 'PENDING', // Padrão
      createdAt: new Date().toISOString(),
      estimatedDelivery: '35–45 min',
    };

    if (!isFirebaseActive) {
      const orders = getLocalOrders();
      orders.unshift(newOrder);
      saveLocalOrders(orders);
      return newOrder;
    }

    try {
      // Sanitiza dados para remover campos undefined que o Firestore rejeita
      const sanitizedOrder = JSON.parse(JSON.stringify(newOrder, (key, value) => {
        return value === undefined ? null : value;
      }));

      await withTimeout(setDoc(doc(db, 'orders', orderId), sanitizedOrder), 2500);
      return newOrder;
    } catch (err) {
      console.error('[OrderService] Erro ao salvar pedido no Firestore:', err);
      throw err;
    }
  },

  /**
   * Busca pedidos com filtros (utilizado pelo admin e pelo histórico do cliente)
   */
  async getOrders(filters = {}) {
    if (!isFirebaseActive) {
      let list = getLocalOrders();
      
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(o => o.status === filters.status);
      }
      
      if (filters.limit) {
        list = list.slice(0, filters.limit);
      }
      
      return list;
    }

    try {
      const collRef = collection(db, 'orders');
      // Queries complexas no Firestore exigem índices, então fazemos ordenação simples por data e filtramos em memória para MVP
      const q = query(collRef, orderBy('createdAt', 'desc'));
      const snapshot = await withTimeout(getDocs(q), 2500);
      let list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });

      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(o => o.status === filters.status);
      }

      if (filters.limit) {
        list = list.slice(0, filters.limit);
      }

      return list;
    } catch (err) {
      console.error('[OrderService] Erro ao buscar pedidos no Firestore:', err);
      return getLocalOrders();
    }
  },

  /**
   * Atualiza o status do ciclo de vida físico do pedido
   */
  async updateOrderStatus(orderId, status) {
    if (!isFirebaseActive) {
      const orders = getLocalOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) throw new Error('Pedido não encontrado');
      
      orders[idx].status = status;
      orders[idx].updatedAt = new Date().toISOString();
      saveLocalOrders(orders);
      return orders[idx];
    }

    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status: status,
        updatedAt: new Date().toISOString()
      });
      
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() };
    } catch (err) {
      console.error('[OrderService] Erro ao atualizar status do pedido no Firestore:', err);
      throw err;
    }
  }
};
