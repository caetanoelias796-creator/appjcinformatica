/**
 * PizzaFlow — CategoryService
 * Camada de serviço de persistência de categorias integrada ao Firestore e Storage.
 */

import { db, storage, isFirebaseActive } from './firebase.js';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { categories as mockCategories, products as mockProducts } from '@data/mockData.js';

// Função auxiliar para fazer upload no Firebase Storage
async function uploadToStorage(file, folder) {
  if (!isFirebaseActive || !storage) return '';
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
  const fileRef = ref(storage, `${folder}/${fileName}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

// Auto-seeding do Firestore com as categorias locais
async function seedCategoriesIfNeeded() {
  if (!isFirebaseActive) return;
  try {
    const collRef = collection(db, 'categories');
    const snapshot = await getDocs(collRef);
    if (snapshot.empty) {
      console.info('🌱 Semeando categorias no Firestore a partir do mockData...');
      const batch = writeBatch(db);
      
      mockCategories.forEach((cat) => {
        const docRef = doc(collRef, cat.id);
        batch.set(docRef, {
          ...cat,
          active: cat.active ?? true,
          displayOrder: cat.displayOrder ?? 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.info('🌱 Categorias semeadas com sucesso.');
    }
  } catch (err) {
    console.error('Erro ao semear categorias no Firestore:', err);
  }
}

// Executa o seeding inicial em segundo plano
setTimeout(seedCategoriesIfNeeded, 1000);

export const CategoryService = {
  /**
   * Busca todas as categorias ativas
   */
  async getCategories() {
    if (!isFirebaseActive) {
      return mockCategories.filter(c => c.active !== false);
    }

    try {
      // Retorna apenas categorias ativas, excluindo a categoria virtual 'all' do Firestore se existir
      const q = query(collection(db, 'categories'), where('active', '==', true));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      
      // Se a categoria virtual 'all' não estiver na lista e for o app cliente, nós a adicionamos em memória
      const hasAll = list.some(c => c.id === 'all');
      if (!hasAll) {
        list.unshift({ id: 'all', label: 'Todas', icon: '🍕', count: 175 });
      }
      
      return list;
    } catch (err) {
      console.error('[CategoryService] Erro ao listar categorias:', err);
      return mockCategories.filter(c => c.active !== false);
    }
  },

  /**
   * Busca categorias para o painel administrativo (paginado/filtrado)
   */
  async getAdminCategories(filters = {}) {
    if (!isFirebaseActive) {
      let result = [...mockCategories];

      // Remove a categoria virtual 'all'
      result = result.filter(c => c.id !== 'all');

      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(c =>
          c.label.toLowerCase().includes(q) ||
          (c.name && c.name.toLowerCase().includes(q))
        );
      }

      if (filters.active !== undefined) {
        result = result.filter(c => (c.active !== false) === filters.active);
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
      };
    }

    try {
      const collRef = collection(db, 'categories');
      const snapshot = await getDocs(collRef);
      let list = [];
      snapshot.forEach(doc => {
        if (doc.id !== 'all') {
          list.push({ id: doc.id, ...doc.data() });
        }
      });

      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(c =>
          (c.label || '').toLowerCase().includes(q) ||
          (c.name || '').toLowerCase().includes(q)
        );
      }

      if (filters.active !== undefined) {
        list = list.filter(c => (c.active !== false) === filters.active);
      }

      // Ordenação
      const sort = filters.sort || 'order';
      const order = filters.order || 'asc';
      list.sort((a, b) => {
        let valA, valB;
        if (sort === 'name') {
          valA = a.name || a.label;
          valB = b.name || b.label;
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
        items: paginated.map(c => ({
          ...c,
          name: c.name || c.label,
          active: c.active !== false,
          displayOrder: c.displayOrder || 0
        })),
        total: list.length,
        page,
        limit,
        pages: Math.ceil(list.length / limit)
      };
    } catch (err) {
      console.error('[CategoryService] Erro ao listar categorias no Admin:', err);
      throw err;
    }
  },

  /**
   * Cadastra uma nova categoria
   */
  async createCategory(data) {
    if (data.imageFile && data.imageFile instanceof File) {
      try {
        data.image = await uploadToStorage(data.imageFile, 'categories');
      } catch (err) {
        console.error('[CategoryService] Erro no upload da imagem:', err);
      }
    }
    delete data.imageFile;

    const newId = `cat-${Date.now()}`;
    const newCat = {
      id: newId,
      label: data.name,
      name: data.name,
      slug: data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      icon: data.image && !data.image.startsWith('http') && !data.image.startsWith('/') ? data.image : '📁',
      image: data.image || '',
      description: data.description || '',
      displayOrder: parseInt(data.displayOrder || 0, 10),
      active: data.active !== false,
      count: 0
    };

    if (!isFirebaseActive) {
      const nameLower = data.name.toLowerCase();
      const exists = mockCategories.some(c => (c.name || c.label).toLowerCase() === nameLower);
      if (exists) {
        throw new Error('Já existe uma categoria cadastrada com este nome.');
      }
      mockCategories.push(newCat);
      return newCat;
    }

    try {
      // Valida duplicidade
      const q = query(collection(db, 'categories'), where('name', '==', data.name));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('Já existe uma categoria cadastrada com este nome.');
      }

      await setDoc(doc(db, 'categories', newId), {
        ...newCat,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return newCat;
    } catch (err) {
      console.error('[CategoryService] Erro ao cadastrar categoria no Firestore:', err);
      throw err;
    }
  },

  /**
   * Atualiza uma categoria existente
   */
  async updateCategory(id, data) {
    if (data.imageFile && data.imageFile instanceof File) {
      try {
        data.image = await uploadToStorage(data.imageFile, 'categories');
      } catch (err) {
        console.error('[CategoryService] Erro no upload da imagem:', err);
      }
    }
    delete data.imageFile;

    if (!isFirebaseActive) {
      const idx = mockCategories.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Categoria não encontrada');

      const updated = {
        ...mockCategories[idx],
        name: data.name ?? mockCategories[idx].name,
        label: data.name ?? mockCategories[idx].label,
        description: data.description ?? mockCategories[idx].description,
        image: data.image ?? mockCategories[idx].image,
        icon: data.image && !data.image.startsWith('http') && !data.image.startsWith('/') ? data.image : mockCategories[idx].icon,
        displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : mockCategories[idx].displayOrder,
        active: data.active !== undefined ? data.active : mockCategories[idx].active
      };

      mockCategories[idx] = updated;
      return updated;
    }

    try {
      const docRef = doc(db, 'categories', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Categoria não encontrada');

      const currentData = docSnap.data();
      const updated = {
        ...currentData,
        name: data.name ?? currentData.name,
        label: data.name ?? currentData.label,
        description: data.description ?? currentData.description,
        image: data.image ?? currentData.image,
        icon: data.image && !data.image.startsWith('http') && !data.image.startsWith('/') ? data.image : currentData.icon,
        displayOrder: data.displayOrder !== undefined ? parseInt(data.displayOrder, 10) : currentData.displayOrder,
        active: data.active !== undefined ? data.active : currentData.active,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, updated);
      return updated;
    } catch (err) {
      console.error('[CategoryService] Erro ao editar categoria no Firestore:', err);
      throw err;
    }
  },

  /**
   * Remove uma categoria
   */
  async deleteCategory(id) {
    // Valida se há produtos vinculados
    if (!isFirebaseActive) {
      const hasLinked = mockProducts.some(p => p.category === id || p.categoryId === id);
      if (hasLinked) {
        throw new Error('Não é possível excluir uma categoria que possui produtos vinculados.');
      }

      const idx = mockCategories.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Categoria não encontrada');
      mockCategories.splice(idx, 1);
      return true;
    }

    try {
      // Valida produtos vinculados no Firestore
      const q = query(collection(db, 'products'), where('category', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('Não é possível excluir uma categoria que possui produtos vinculados.');
      }

      await deleteDoc(doc(db, 'categories', id));
      return true;
    } catch (err) {
      console.error('[CategoryService] Erro ao deletar categoria no Firestore:', err);
      throw err;
    }
  }
};
