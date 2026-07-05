/**
 * PizzaFlow — Store v2 (com persistência localStorage)
 * State management com Observer Pattern + auto-save do carrinho.
 */

import { setStorage, getStorage } from '@utils/helpers.js';

/* ==========================================================================
   ESTADO INICIAL
   ========================================================================== */

const initialState = {
  cart: {
    items: [],
    count: 0,
    total: 0,
    savedAt: null,
  },
  currentPage:       'home',
  currentProductId:  null,
  searchQuery:       '',
  selectedCategory:  'all',
  loading:           false,
  user: {
    name:          null,
    address:       null,
    addressData:   null,
    estimatedTime: '35–45 min',
    isLoggedIn:    false,
  },
  toasts:         [],
  pwaPromptEvent: null,
};

/* ==========================================================================
   PERSISTÊNCIA
   ========================================================================== */

const CART_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Restaura o carrinho salvo no localStorage (se não expirado)
 * @returns {{ items: any[], count: number, total: number, savedAt: number|null }}
 */
function restoreCart() {
  const saved = getStorage('cart', null);
  if (!saved) return initialState.cart;

  const expired = saved.savedAt && (Date.now() - saved.savedAt) > CART_TTL_MS;
  if (expired) {
    return initialState.cart;
  }

  return saved;
}

/**
 * Restaura o endereço salvo
 */
function restoreUserAddress() {
  return getStorage('user-address', null);
}

/* ==========================================================================
   CLASSE STORE
   ========================================================================== */

class Store {
  #state;
  #listeners;

  constructor(state) {
    // Restaura carrinho e endereço persistidos
    const savedCart    = restoreCart();
    const savedAddress = restoreUserAddress();

    this.#state = {
      ...JSON.parse(JSON.stringify(state)),
      cart: savedCart,
      user: {
        ...state.user,
        address:     savedAddress?.formatted || 'Selecione um endereço',
        addressData: savedAddress || null,
      },
    };
    this.#listeners = new Map();
  }

  /* ── GET STATE ──────────────────────────────────────────── */

  getState() {
    return structuredClone(this.#state);
  }

  /* ── SUBSCRIBE ──────────────────────────────────────────── */

  subscribe(key, callback) {
    if (!this.#listeners.has(key)) {
      this.#listeners.set(key, new Set());
    }
    this.#listeners.get(key).add(callback);
    return () => {
      const set = this.#listeners.get(key);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.#listeners.delete(key);
      }
    };
  }

  /* ── SET STATE ──────────────────────────────────────────── */

  setState(updates) {
    const prevState = { ...this.#state };
    this.#state = { ...this.#state, ...updates };

    Object.keys(updates).forEach(key => {
      this.#listeners.get(key)?.forEach(cb =>
        cb(this.#state[key], prevState[key])
      );
    });

    this.#listeners.get('*')?.forEach(cb =>
      cb(this.#state, prevState)
    );
  }

  /* ── DISPATCH ───────────────────────────────────────────── */

  dispatch(action, payload) {
    switch (action) {

      case 'ADD_TO_CART':
        this.#addToCart(payload);
        break;

      case 'REMOVE_FROM_CART':
        this.#removeFromCart(payload);
        break;

      case 'UPDATE_QUANTITY':
        this.#updateQuantity(payload);
        break;

      case 'CLEAR_CART':
        this.setState({ cart: { items: [], count: 0, total: 0, savedAt: null } });
        setStorage('cart', null);
        break;

      case 'SET_PAGE':
        this.setState({ currentPage: payload });
        break;

      case 'SET_PRODUCT':
        this.setState({ currentProductId: payload });
        break;

      case 'SET_SEARCH':
        this.setState({ searchQuery: payload });
        break;

      case 'SET_CATEGORY':
        this.setState({ selectedCategory: payload });
        break;

      case 'SET_LOADING':
        this.setState({ loading: Boolean(payload) });
        break;

      case 'SET_USER':
        this.setState({ user: { ...this.#state.user, ...payload } });
        break;

      case 'SET_ADDRESS': {
        const addressData = payload;
        const userUpdate = {
          ...this.#state.user,
          address:     addressData.formatted,
          addressData: addressData,
        };
        this.setState({ user: userUpdate });
        setStorage('user-address', addressData);
        break;
      }

      case 'SET_PWA_PROMPT':
        this.setState({ pwaPromptEvent: payload });
        break;

      default:
        console.warn(`[Store] Ação desconhecida: "${action}"`);
    }
  }

  /* ── CART ───────────────────────────────────────────────── */

  #addToCart(product) {
    const currentItems = [...this.#state.cart.items];
    const key = product.size ? `${product.id}-${product.size.id}` : product.id;

    const existingIndex = currentItems.findIndex(item => {
      const itemKey = item.size ? `${item.id}-${item.size.id}` : item.id;
      return itemKey === key;
    });

    if (existingIndex >= 0) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: currentItems[existingIndex].quantity + 1,
      };
    } else {
      currentItems.push({ ...product, quantity: 1 });
    }

    const newCart = this.#computeCartTotals(currentItems);
    this.setState({ cart: newCart });
    setStorage('cart', newCart); // ← persiste
  }

  #removeFromCart(productId) {
    const updatedItems = this.#state.cart.items.filter(item => item.id !== productId);
    const newCart = this.#computeCartTotals(updatedItems);
    this.setState({ cart: newCart });
    setStorage('cart', newCart);
  }

  #updateQuantity({ id, quantity }) {
    if (quantity <= 0) {
      this.#removeFromCart(id);
      return;
    }
    const updatedItems = this.#state.cart.items.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    const newCart = this.#computeCartTotals(updatedItems);
    this.setState({ cart: newCart });
    setStorage('cart', newCart);
  }

  #computeCartTotals(items) {
    const count = items.reduce((acc, item) => acc + item.quantity, 0);
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return { items, count, total, savedAt: Date.now() };
  }
}

/* ==========================================================================
   SINGLETON
   ========================================================================== */

export const store = new Store(initialState);

/* ==========================================================================
   HELPERS
   ========================================================================== */

export function onCartChange(callback) {
  return store.subscribe('cart', callback);
}

export function onPageChange(callback) {
  return store.subscribe('currentPage', callback);
}

export function onUserChange(callback) {
  return store.subscribe('user', callback);
}

export function isInCart(productId) {
  return store.getState().cart.items.some(item => item.id === productId);
}

export function getCartQuantity(productId) {
  const item = store.getState().cart.items.find(i => i.id === productId);
  return item ? item.quantity : 0;
}
