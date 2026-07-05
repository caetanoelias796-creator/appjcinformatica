/**
 * PizzaFlow — Product Card Component
 * Card de produto reutilizável com variante vertical e horizontal.
 */

import { store, isInCart, getCartQuantity } from '@store/store.js';
import { formatCurrency } from '@utils/formatters.js';
import { openProductModal } from '@components/product/ProductModal.js';
import { toastCart } from '@components/Toast.js';
import { addRipple } from '@utils/helpers.js';

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

/**
 * Cria um card de produto
 * @param {Product} product
 * @param {object} [options]
 * @param {'vertical'|'horizontal'} [options.layout='vertical']
 * @returns {{ el: HTMLElement, destroy: Function, update: Function }}
 */
export function ProductCard(product, options = {}) {
  const { layout = 'vertical' } = options;
  let element = null;
  let isFav = false;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('article');
    element.className = `product-card${layout === 'horizontal' ? ' horizontal' : ''}`;
    element.setAttribute('aria-label', `${product.name} — ${formatCurrency(product.price)}`);

    render();
    setupEvents();
    addRipple(element);

    return element;
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render() {
    if (!element) return;

    const inCart    = isInCart(product.id);
    const qty       = getCartQuantity(product.id);
    const hasDiscount = product.discount && product.originalPrice;
    const discountedPrice = hasDiscount
      ? product.originalPrice * (1 - product.discount / 100)
      : product.price;

    // Badges
    const badges = [];
    if (hasDiscount)        badges.push(`<span class="badge badge-primary">-${product.discount}%</span>`);
    if (product.isBestSeller) badges.push(`<span class="badge badge-secondary">🔥 Mais pedida</span>`);
    if (product.isNew)      badges.push(`<span class="badge badge-success">✨ Novo</span>`);

    const badgesHtml = badges.length > 0
      ? `<div class="product-card-badges">${badges.join('')}</div>`
      : '';

    // Preço
    const priceHtml = hasDiscount
      ? `
          <div class="product-card-price-block">
            <span class="product-card-original">${formatCurrency(product.originalPrice)}</span>
            <span class="product-card-price discounted">${formatCurrency(discountedPrice)}</span>
          </div>
        `
      : `
          <div class="product-card-price-block">
            <span class="product-card-price">${formatCurrency(product.price)}</span>
          </div>
        `;

    // Botão add/qty
    const addButtonHtml = inCart
      ? `
          <div class="qty-control">
            <button class="qty-btn" data-action="decrease" aria-label="Remover 1 ${product.name}">−</button>
            <span class="qty-value">${qty}</span>
            <button class="qty-btn" data-action="increase" aria-label="Adicionar 1 ${product.name}">+</button>
          </div>
        `
      : `
          <button
            class="product-card-add"
            data-action="add"
            aria-label="Adicionar ${product.name} ao carrinho"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        `;

    // Rating
    const ratingHtml = `
      <div class="rating" aria-label="Avaliação: ${product.rating} de 5">
        <span aria-hidden="true">⭐</span>
        <span>${product.rating.toFixed(1)}</span>
        <span class="rating-count">(${product.reviewCount})</span>
      </div>
    `;

    if (layout === 'horizontal') {
      element.innerHTML = `
        <!-- Imagem -->
        <div class="product-card-image-wrapper">
          ${badgesHtml}
          <img
            class="product-card-image"
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            onerror="this.style.background='var(--color-surface-light)'; this.style.display='block';"
          />
        </div>

        <!-- Corpo -->
        <div class="product-card-body">
          <div>
            <h3 class="product-card-name">${product.name}</h3>
            ${ratingHtml}
          </div>
          <div class="product-card-footer">
            ${priceHtml}
            ${addButtonHtml}
          </div>
        </div>
      `;
    } else {
      element.innerHTML = `
        <!-- Imagem com badges -->
        <div class="product-card-image-wrapper">
          ${badgesHtml}
          <button
            class="product-card-fav ${isFav ? 'active' : ''}"
            data-action="fav"
            aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} — ${product.name}"
            aria-pressed="${isFav}"
            type="button"
          >${isFav ? '❤️' : '🤍'}</button>
          <img
            class="product-card-image"
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            onerror="this.style.opacity='0';"
          />
        </div>

        <!-- Corpo -->
        <div class="product-card-body">
          <span class="product-card-category">${getCategoryLabel(product.category)}</span>
          <h3 class="product-card-name line-clamp-2">${product.name}</h3>
          <p class="product-card-desc">${product.description}</p>
          ${ratingHtml}
          <div class="product-card-footer">
            ${priceHtml}
            ${addButtonHtml}
          </div>
        </div>
      `;
    }
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    if (!element) return;

    element.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;

      switch (action) {
        case 'add':
          handleAdd(e);
          break;
        case 'increase':
          e.stopPropagation();
          store.dispatch('UPDATE_QUANTITY', {
            id: product.id,
            quantity: getCartQuantity(product.id) + 1,
          });
          render();
          break;
        case 'decrease':
          e.stopPropagation();
          store.dispatch('UPDATE_QUANTITY', {
            id: product.id,
            quantity: getCartQuantity(product.id) - 1,
          });
          render();
          break;
        case 'fav':
          e.stopPropagation();
          isFav = !isFav;
          render();
          break;
        default:
          // Clique no card → abre o modal de customização/detalhe
          if (!e.target.closest('.qty-control, .product-card-fav')) {
            openProductModal(product.id);
          }
      }
    });
  }

  /* ── ADD TO CART ─────────────────────────────────────────── */
  function handleAdd(e) {
    e.stopPropagation();

    // Animação do botão
    const btn = e.target.closest('[data-action="add"]');
    if (btn) {
      btn.classList.add('anim-bounce-in');
      btn.addEventListener('animationend', () => {
        btn.classList.remove('anim-bounce-in');
      }, { once: true });
    }

    store.dispatch('ADD_TO_CART', {
      id: product.id,
      name: product.name,
      price: product.discount
        ? product.originalPrice * (1 - product.discount / 100)
        : product.price,
      image: product.image,
    });

    toastCart(product.name);
    render(); // Re-render para mostrar qty control
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(newProduct) {
    Object.assign(product, newProduct);
    render();
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    element = null;
  }

  return { build, destroy, update };
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

const CATEGORY_LABELS = {
  'pizza-classica': 'Pizza Clássica',
  'pizza-especial': 'Pizza Especial',
  'bebidas':        'Bebida',
  'sobremesas':     'Sobremesa',
  'combos':         'Combo',
};

function getCategoryLabel(categoryId) {
  return CATEGORY_LABELS[categoryId] ?? categoryId;
}
