/**
 * PizzaFlow — Product Builder Store
 * State management para o construtor/customizador de pizzas.
 */

import { calculatePrice } from '@services/PriceCalculator.js';

const initialState = {
  product: null,
  size: null,        // ex: { id: 'media', label: 'Média (25cm)', price: 82 }
  flavors: [],       // array de objetos de produtos (sabores selecionados)
  crust: null,       // ex: { id: 'catupiry', name: 'Borda de Catupiry', price: 5.00 }
  extras: [],        // array de extras selecionados
  quantity: 1,
  note: '',          // observações
  subtotal: 0,
  extrasTotal: 0,
  bordaTotal: 0,
  total: 0
};

class ProductBuilderStoreClass {
  #state;
  #listeners;

  constructor() {
    this.#state = { ...initialState };
    this.#listeners = new Set();
  }

  /* ── GETTERS ────────────────────────────────────────────── */

  getState() {
    return { ...this.#state };
  }

  /* ── LISTENERS ──────────────────────────────────────────── */

  subscribe(callback) {
    this.#listeners.add(callback);
    // Retorna função para cancelar a inscrição
    return () => this.#listeners.delete(callback);
  }

  #notify() {
    this.#listeners.forEach(cb => cb(this.getState()));
  }

  /* ── MUTATORS ───────────────────────────────────────────── */

  init(product, allProducts) {
    const size = product.sizes?.[1] || product.sizes?.[0] || null; // default para Média ou primeiro
    
    this.#state = {
      ...initialState,
      product,
      size,
      flavors: [product], // Inicializa com o sabor do próprio produto
      quantity: 1,
      note: ''
    };
    
    this.updatePrice();
  }

  setSize(size) {
    this.#state.size = size;
    
    // Ajusta os sabores se o novo tamanho tiver um limite menor
    const maxFlavors = this.getMaxFlavors();
    if (this.#state.flavors.length > maxFlavors) {
      this.#state.flavors = this.#state.flavors.slice(0, maxFlavors);
    }
    
    this.updatePrice();
  }

  setFlavors(flavors) {
    const maxFlavors = this.getMaxFlavors();
    this.#state.flavors = flavors.slice(0, maxFlavors);
    this.updatePrice();
  }

  addFlavor(flavor) {
    const maxFlavors = this.getMaxFlavors();
    if (this.#state.flavors.length < maxFlavors) {
      this.#state.flavors.push(flavor);
      this.updatePrice();
    }
  }

  removeFlavor(flavorId) {
    // Mantém pelo menos um sabor
    if (this.#state.flavors.length > 1) {
      this.#state.flavors = this.#state.flavors.filter(f => f.id !== flavorId);
      this.updatePrice();
    }
  }

  setCrust(crust) {
    this.#state.crust = crust;
    this.updatePrice();
  }

  setExtras(extras) {
    this.#state.extras = extras;
    this.updatePrice();
  }

  addExtra(extra) {
    if (!this.#state.extras.some(e => e.id === extra.id)) {
      this.#state.extras.push(extra);
      this.updatePrice();
    }
  }

  removeExtra(extraId) {
    this.#state.extras = this.#state.extras.filter(e => e.id !== extraId);
    this.updatePrice();
  }

  setQuantity(quantity) {
    if (quantity >= 1) {
      this.#state.quantity = quantity;
      this.updatePrice();
    }
  }

  setNote(note) {
    this.#state.note = note;
    this.#notify();
  }

  /* ── PRICE COMPUTATION ──────────────────────────────────── */

  updatePrice() {
    const { product, size, flavors, extras, crust, quantity } = this.#state;
    const pricing = calculatePrice(product, size, flavors, extras, crust, quantity);
    
    this.#state.subtotal = pricing.subtotal;
    this.#state.extrasTotal = pricing.extras;
    this.#state.bordaTotal = pricing.borda;
    this.#state.total = pricing.total;
    
    this.#notify();
  }

  /* ── HELPERS ────────────────────────────────────────────── */

  getMaxFlavors() {
    const sizeId = this.#state.size?.id;
    if (sizeId === 'broto') return 1;
    if (sizeId === 'media') return 2;
    if (sizeId === 'grande') return 2;
    if (sizeId === 'trem' || sizeId === 'gigante') return 4;
    return 1;
  }
}

export const productBuilderStore = new ProductBuilderStoreClass();
