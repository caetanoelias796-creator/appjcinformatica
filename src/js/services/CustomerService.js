/**
 * PizzaFlow — CustomerService
 * Camada de serviço de persistência de clientes e perfis integrada ao Firestore.
 */

import { db, isFirebaseActive } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

export const CustomerService = {
  /**
   * Salva dados de entrega localmente e também no Firestore se o Firebase estiver ativo
   */
  async saveDeliveryData(deliveryData, customerId = null) {
    // 1. Salva no localStorage (para persistência off-line local rápida)
    try {
      localStorage.setItem('pizzaflow_delivery_data', JSON.stringify(deliveryData));
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }

    if (!isFirebaseActive) return true;

    // 2. Se houver um ID ou se estiver logado, salva na nuvem no Firestore
    const uid = customerId || 'anonymous_' + Date.now();
    try {
      const docRef = doc(db, 'customers', uid);
      await setDoc(docRef, {
        ...deliveryData,
        customerId: uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('[CustomerService] Erro ao salvar dados no Firestore:', err);
      return false;
    }
  },

  /**
   * Recupera dados de entrega persistidos
   */
  async loadDeliveryData(customerId = null) {
    // Tenta primeiro carregar do localStorage
    try {
      const saved = localStorage.getItem('pizzaflow_delivery_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler localStorage', e);
    }

    if (!isFirebaseActive || !customerId) return null;

    // Se tiver ID e estiver no Firebase, busca na nuvem
    try {
      const docSnap = await getDoc(doc(db, 'customers', customerId));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (err) {
      console.error('[CustomerService] Erro ao ler dados do Firestore:', err);
      return null;
    }
  }
};
