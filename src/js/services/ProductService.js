/**
 * PizzaFlow — ProductService
 * Camada de serviço de persistência de produtos integrada ao Firestore e Storage.
 */

import { db, storage, isFirebaseActive, withTimeout } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { products as mockProducts } from '@data/mockData.js';

// Função auxiliar para fazer upload no Firebase Storage
async function uploadToStorage(file, folder) {
  if (!isFirebaseActive || !storage) return '';
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
  const fileRef = ref(storage, `${folder}/${fileName}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

// Auto-seeding do Firestore com os produtos locais
async function seedProductsIfNeeded() {
  if (!isFirebaseActive) return;
  try {
    const collRef = collection(db, 'products');
    const snapshot = await getDocs(collRef);
    if (snapshot.empty) {
      console.info('🌱 Semeando produtos no Firestore a partir do mockData...');
      const batch = writeBatch(db);
      
      // Filtramos apenas alguns produtos representativos do mockData para não estourar limites do Firestore gratuito de uma vez
      const seedList = mockProducts.slice(0, 30); 
      
      seedList.forEach((prod) => {
        const docRef = doc(collRef, prod.id);
        batch.set(docRef, {
          ...prod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.info('🌱 Semeado com sucesso.');
    }
  } catch (err) {
    console.error('Erro ao semear produtos no Firestore:', err);
  }
}

// Executa o seeding inicial em segundo plano
setTimeout(seedProductsIfNeeded, 1000);

export const ProductService = {
  /**
   * Lista todos os produtos disponíveis
   */
  async getProducts() {
    if (!isFirebaseActive) {
      return mockProducts.filter(p => p.isAvailable);
    }
    
    try {
      const q = query(collection(db, 'products'), where('isAvailable', '==', true));
      const snapshot = await withTimeout(getDocs(q), 2500);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (err) {
      console.error('[ProductService] Erro ao listar produtos:', err);
      // Fallback
      return mockProducts.filter(p => p.isAvailable);
    }
  },

  /**
   * Busca produto por ID
   */
  async getProductById(id) {
    if (!isFirebaseActive) {
      const p = mockProducts.find(p => p.id === id);
      if (!p) throw new Error('Produto não encontrado');
      return p;
    }

    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await withTimeout(getDoc(docRef), 2500);
      if (!docSnap.exists()) {
        throw new Error('Produto não encontrado');
      }
      return { id: docSnap.id, ...docSnap.data() };
    } catch (err) {
      console.error('[ProductService] Erro ao buscar produto por ID:', err);
      const p = mockProducts.find(p => p.id === id);
      if (!p) throw new Error('Produto não encontrado');
      return p;
    }
  },

  /**
   * Busca produtos por categoria
   */
  async getProductsByCategory(categoryId) {
    if (!isFirebaseActive) {
      if (categoryId === 'all') return mockProducts.filter(p => p.isAvailable);
      return mockProducts.filter(p => p.isAvailable && (p.category === categoryId || p.categoryId === categoryId));
    }

    try {
      let q;
      if (categoryId === 'all') {
        q = query(collection(db, 'products'), where('isAvailable', '==', true));
      } else {
        q = query(collection(db, 'products'), where('isAvailable', '==', true), where('category', '==', categoryId));
      }
      const snapshot = await withTimeout(getDocs(q), 2500);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (err) {
      console.error('[ProductService] Erro ao filtrar produtos por categoria:', err);
      return this.getProducts();
    }
  },

  /**
   * Pesquisa produtos por query
   */
  async searchProducts(queryStr) {
    const cleanQuery = queryStr.trim().toLowerCase();
    
    // Firestore não possui pesquisa full-text nativa robusta em queries normais,
    // então para o MVP trazemos os produtos ativos e filtramos em memória.
    const all = await this.getProducts();
    if (!cleanQuery) return all;
    
    return all.filter(p => 
      p.name.toLowerCase().includes(cleanQuery) || 
      (p.description && p.description.toLowerCase().includes(cleanQuery))
    );
  },

  /**
   * Busca produtos com paginação e filtros para o painel de administração
   */
  async getAdminProducts(filters = {}) {
    if (!isFirebaseActive) {
      let result = [...mockProducts];

      if (filters.categoryId && filters.categoryId !== 'all') {
        result = result.filter(p => p.category === filters.categoryId || p.categoryId === filters.categoryId);
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }

      if (filters.active !== undefined) {
        result = result.filter(p => p.isAvailable === filters.active || p.active === filters.active);
      }

      const page = parseInt(filters.page || 1, 10);
      const limit = parseInt(filters.limit || 10, 10);
      const skip = (page - 1) * limit;
      const paginated = result.slice(skip, skip + limit);

      return {
        items: paginated.map(p => ({
          ...p,
          active: p.isAvailable ?? p.active ?? true
        })),
        total: result.length,
        page,
        limit,
        pages: Math.ceil(result.length / limit)
      };
    }

    try {
      // Para o painel admin Firestore trazemos os dados (limitados ao escopo do MVP)
      // e filtramos/paginamos localmente no Service para manter flexibilidade total
      const collRef = collection(db, 'products');
      const snapshot = await getDocs(collRef);
      let list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });

      if (filters.categoryId && filters.categoryId !== 'all') {
        list = list.filter(p => p.category === filters.categoryId || p.categoryId === filters.categoryId);
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }

      if (filters.active !== undefined) {
        list = list.filter(p => (p.isAvailable ?? p.active ?? true) === filters.active);
      }

      const page = parseInt(filters.page || 1, 10);
      const limit = parseInt(filters.limit || 10, 10);
      const skip = (page - 1) * limit;
      const paginated = list.slice(skip, skip + limit);

      return {
        items: paginated.map(p => ({
          ...p,
          active: p.isAvailable ?? p.active ?? true
        })),
        total: list.length,
        page,
        limit,
        pages: Math.ceil(list.length / limit)
      };
    } catch (err) {
      console.error('[ProductService] Erro ao carregar produtos do Admin:', err);
      throw err;
    }
  },

  /**
   * Cria um novo produto
   */
  async createProduct(productData) {
    // Processa upload de imagem se for enviado arquivo do Storage
    if (productData.imageFile && productData.imageFile instanceof File) {
      try {
        productData.image = await uploadToStorage(productData.imageFile, 'products');
      } catch (err) {
        console.error('[ProductService] Erro no upload da imagem:', err);
      }
    }
    delete productData.imageFile;

    const newId = `prod-${Date.now()}`;
    const slug = productData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    
    const mappedProduct = {
      id: newId,
      name: productData.name,
      slug,
      category: productData.categoryId,
      categoryId: productData.categoryId,
      description: productData.description || '',
      image: productData.image || '/assets/pizza_hero.png',
      type: productData.type || 'PIZZA',
      price: productData.sizes?.[0]?.price || 0,
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

    if (!isFirebaseActive) {
      mockProducts.unshift(mappedProduct);
      return mappedProduct;
    }

    try {
      await setDoc(doc(db, 'products', newId), {
        ...mappedProduct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return mappedProduct;
    } catch (err) {
      console.error('[ProductService] Erro ao cadastrar produto no Firestore:', err);
      throw err;
    }
  },

  /**
   * Atualiza um produto existente
   */
  async updateProduct(id, productData) {
    if (productData.imageFile && productData.imageFile instanceof File) {
      try {
        productData.image = await uploadToStorage(productData.imageFile, 'products');
      } catch (err) {
        console.error('[ProductService] Erro no upload da imagem:', err);
      }
    }
    delete productData.imageFile;

    if (!isFirebaseActive) {
      const idx = mockProducts.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Produto não encontrado');

      const updated = {
        ...mockProducts[idx],
        name: productData.name ?? mockProducts[idx].name,
        description: productData.description ?? mockProducts[idx].description,
        image: productData.image ?? mockProducts[idx].image,
        category: productData.categoryId ?? mockProducts[idx].categoryId,
        categoryId: productData.categoryId ?? mockProducts[idx].categoryId,
        type: productData.type ?? mockProducts[idx].type,
        isAvailable: productData.active ?? mockProducts[idx].isAvailable,
        active: productData.active ?? mockProducts[idx].active,
        price: productData.sizes?.[0]?.price ?? mockProducts[idx].price,
        sizes: productData.sizes
          ? productData.sizes.map((s, idxS) => ({
              id: s.id || `size-${idxS}-${Date.now()}`,
              name: s.name,
              price: parseFloat(s.price),
              maxFlavors: s.maxFlavors || 1,
              order: s.order || 0
            }))
          : mockProducts[idx].sizes
      };

      mockProducts[idx] = updated;
      return updated;
    }

    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Produto não encontrado');

      const currentData = docSnap.data();
      const updated = {
        ...currentData,
        name: productData.name ?? currentData.name,
        description: productData.description ?? currentData.description,
        image: productData.image ?? currentData.image,
        category: productData.categoryId ?? currentData.categoryId,
        categoryId: productData.categoryId ?? currentData.categoryId,
        type: productData.type ?? currentData.type,
        isAvailable: productData.active ?? currentData.isAvailable,
        active: productData.active ?? currentData.active,
        price: productData.sizes?.[0]?.price ?? currentData.price,
        sizes: productData.sizes
          ? productData.sizes.map((s, idxS) => ({
              id: s.id || `size-${idxS}-${Date.now()}`,
              name: s.name,
              price: parseFloat(s.price),
              maxFlavors: s.maxFlavors || 1,
              order: s.order || 0
            }))
          : currentData.sizes,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, updated);
      return updated;
    } catch (err) {
      console.error('[ProductService] Erro ao editar produto no Firestore:', err);
      throw err;
    }
  },

  /**
   * Exclui um produto
   */
  async deleteProduct(id) {
    if (!isFirebaseActive) {
      const idx = mockProducts.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Produto não encontrado');
      mockProducts.splice(idx, 1);
      return true;
    }

    try {
      await deleteDoc(doc(db, 'products', id));
      return true;
    } catch (err) {
      console.error('[ProductService] Erro ao deletar produto no Firestore:', err);
      throw err;
    }
  }
};
