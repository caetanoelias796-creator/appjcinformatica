/**
 * PizzaFlow — FlavorService
 * Camada de serviço de persistência de sabores integrada ao Firestore.
 */

import { db, isFirebaseActive, withTimeout } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { flavors as mockFlavors } from '@data/mockData.js';

// Auto-seeding do Firestore com os sabores locais
async function seedFlavorsIfNeeded() {
  if (!isFirebaseActive) return;
  try {
    const collRef = collection(db, 'flavors');
    const snapshot = await getDocs(collRef);
    if (snapshot.empty) {
      console.info('🌱 Semeando sabores no Firestore a partir do mockData...');
      const batch = writeBatch(db);
      
      mockFlavors.forEach((flav) => {
        const docRef = doc(collRef, flav.id);
        batch.set(docRef, {
          ...flav,
          active: flav.active ?? true,
          displayOrder: flav.displayOrder ?? 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.info('🌱 Sabores semeados com sucesso.');
    }
  } catch (err) {
    console.error('Erro ao semear sabores no Firestore:', err);
  }
}

// Executa o seeding inicial em segundo plano
setTimeout(seedFlavorsIfNeeded, 1000);

export const FlavorService = {
  /**
   * Busca sabores de forma paginada/filtrada para o painel
   */
  async getAdminFlavors(filters = {}) {
    if (!isFirebaseActive) {
      let result = [...mockFlavors];

      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(f => f.name.toLowerCase().includes(q));
      }

      if (filters.active !== undefined) {
        result = result.filter(f => (f.active !== false) === filters.active);
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

      return {
        items: paginated.map(f => ({
          ...f,
          active: f.active !== false,
          displayOrder: f.displayOrder || 0
        })),
        total: result.length,
        page,
        limit,
        pages: Math.ceil(result.length / limit)
      };
    }

    try {
      const collRef = collection(db, 'flavors');
      const snapshot = await withTimeout(getDocs(collRef), 2500);
      let list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });

      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(f => (f.name || '').toLowerCase().includes(q));
      }

      if (filters.active !== undefined) {
        list = list.filter(f => (f.active !== false) === filters.active);
      }

      // Ordenação
      const sort = filters.sort || 'order';
      const order = filters.order || 'asc';
      list.sort((a, b) => {
        let valA, valB;
        if (sort === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (sort === 'order') {
          valA = a.displayOrder ?? 0;
          valB = b.displayOrder ?? 0;
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
      const paginated = list.slice(skip, skip + limit);

      return {
        items: paginated.map(f => ({
          ...f,
          active: f.active !== false,
          displayOrder: f.displayOrder || 0
        })),
        total: list.length,
        page,
        limit,
        pages: Math.ceil(list.length / limit)
      };
    } catch (err) {
      console.error('[FlavorService] Erro ao listar sabores no Admin:', err);
      throw err;
    }
  },

  /**
   * Cadastra um novo sabor
   */
  async createFlavor(data) {
    const newId = `flavor-${Date.now()}`;
    const newFlavor = {
      id: newId,
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      displayOrder: parseInt(data.displayOrder || 0, 10),
      active: data.active !== false
    };

    if (!isFirebaseActive) {
      const nameLower = data.name.toLowerCase();
      const exists = mockFlavors.some(f => f.name.toLowerCase() === nameLower);
      if (exists) {
        throw new Error('Já existe um sabor cadastrado com este nome.');
      }
      mockFlavors.push(newFlavor);
      return newFlavor;
    }

    try {
      // Valida duplicidade
      const q = query(collection(db, 'flavors'), where('name', '==', data.name));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('Já existe um sabor cadastrado com este nome.');
      }

      await setDoc(doc(db, 'flavors', newId), {
        ...newFlavor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return newFlavor;
    } catch (err) {
      console.error('[FlavorService] Erro ao cadastrar sabor no Firestore:', err);
      throw err;
    }
  },

  /**
   * Atualiza um sabor existente
   */
  async updateFlavor(id, data) {
    if (!isFirebaseActive) {
      const idx = mockFlavors.findIndex(f => f.id === id);
      if (idx === -1) throw new Error('Sabor não encontrado');

      const updated = {
        ...mockFlavors[idx],
        name: data.name ?? mockFlavors[idx].name,
        description: data.description ?? mockFlavors[idx].description,
        image: data.image ?? mockFlavors[idx].image,
        displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : mockFlavors[idx].displayOrder,
        active: data.active !== undefined ? data.active : mockFlavors[idx].active
      };

      mockFlavors[idx] = updated;
      return updated;
    }

    try {
      const docRef = doc(db, 'flavors', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Sabor não encontrado');

      const currentData = docSnap.data();
      const updated = {
        ...currentData,
        name: data.name ?? currentData.name,
        description: data.description ?? currentData.description,
        image: data.image ?? currentData.image,
        displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : currentData.displayOrder,
        active: data.active !== undefined ? data.active : currentData.active,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, updated);
      return updated;
    } catch (err) {
      console.error('[FlavorService] Erro ao editar sabor no Firestore:', err);
      throw err;
    }
  },

  /**
   * Remove um sabor
   */
  async deleteFlavor(id) {
    if (!isFirebaseActive) {
      const idx = mockFlavors.findIndex(f => f.id === id);
      if (idx === -1) throw new Error('Sabor não encontrado');
      mockFlavors.splice(idx, 1);
      return true;
    }

    try {
      await deleteDoc(doc(db, 'flavors', id));
      return true;
    } catch (err) {
      console.error('[FlavorService] Erro ao deletar sabor no Firestore:', err);
      throw err;
    }
  }
};
