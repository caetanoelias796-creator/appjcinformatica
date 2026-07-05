/**
 * PizzaFlow — Cart Page v2
 * Carrinho com endereço, frete, método de pagamento e upsell.
 */

import { store, onCartChange }     from '@store/store.js';
import { navigate }                from '@router/router.js';
import { formatCurrency, formatCartCount } from '@utils/formatters.js';
import { showConfirmDialog }       from '@components/Dialog.js';
import { toastSuccess, toastError, toastInfo } from '@components/Toast.js';
import { openAddressModal }        from '@components/AddressModal.js';
import { fetchProducts }           from '@services/api.js';
import { upsellProductIds }        from '@data/mockData.js';
import { ProductCard }             from '@components/ProductCard.js';

/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const FREE_SHIPPING_THRESHOLD = 60; // R$ 60 para frete grátis
const SHIPPING_FEE = 6.90;

const PAYMENT_METHODS = [
  { id: 'pix',     label: 'Pix',      icon: '⚡', desc: '5% de desconto' },
  { id: 'credit',  label: 'Crédito',  icon: '💳', desc: 'Até 6x sem juros' },
  { id: 'debit',   label: 'Débito',   icon: '💳', desc: 'À vista' },
  { id: 'cash',    label: 'Dinheiro', icon: '💵', desc: 'Troco se necessário' },
];

/* ==========================================================================
   FACTORY
   ========================================================================== */

export default function CartPage() {
  let element          = null;
  let unsubscribeCart  = null;
  let selectedPayment  = 'pix';   // default
  let changeFor        = '';      // troco (para pagamento em dinheiro)
  let allProducts      = [];

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page';
    container.appendChild(element);

    // Carrega produtos para upsell
    try {
      allProducts = await fetchProducts();
    } catch {}

    const { cart } = store.getState();
    render(cart);

    unsubscribeCart = onCartChange((newCart) => render(newCart));

    return { destroy };
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render(cart) {
    if (!element) return;
    if (cart.count === 0) { renderEmpty(); return; }

    const { user }      = store.getState();
    const shipping      = cart.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const pixDiscount   = selectedPayment === 'pix' ? cart.total * 0.05 : 0;
    const total         = cart.total + shipping - pixDiscount;
    const remaining     = FREE_SHIPPING_THRESHOLD - cart.total;

    element.innerHTML = `
      <div style="padding: var(--space-5) var(--content-padding-x) 0;">

        <!-- Cabeçalho -->
        <div class="row-between mb-5">
          <div>
            <h1 class="font-primary font-black" style="font-size:var(--text-2xl);">Meu Carrinho</h1>
            <p class="text-secondary text-sm mt-1">${formatCartCount(cart.count)}</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="cart-clear-btn" aria-label="Limpar carrinho" type="button">
            🗑 Limpar
          </button>
        </div>

        <!-- Barra frete grátis -->
        ${remaining > 0 ? `
          <div class="card p-3 mb-4" style="border:1px solid var(--color-secondary-alpha,rgba(255,193,7,.25)); border-radius:var(--radius-lg);">
            <p style="font-size:var(--text-xs); color:var(--color-secondary); font-weight:var(--weight-semibold); margin-bottom:6px;">
              🚚 Adicione mais ${formatCurrency(remaining)} para ganhar frete grátis!
            </p>
            <div style="height:6px; background:var(--color-surface-light); border-radius:var(--radius-full); overflow:hidden;">
              <div style="
                height:100%;
                width:${Math.min(100, (cart.total / FREE_SHIPPING_THRESHOLD) * 100).toFixed(1)}%;
                background:var(--color-secondary);
                border-radius:var(--radius-full);
                transition:width var(--transition-normal);
              "></div>
            </div>
          </div>
        ` : `
          <div class="card p-3 mb-4" style="border:1px solid rgba(67,160,71,.3); border-radius:var(--radius-lg); background:rgba(67,160,71,.08);">
            <p style="font-size:var(--text-xs); color:var(--color-success); font-weight:var(--weight-semibold);">
              🎉 Frete grátis desbloqueado!
            </p>
          </div>
        `}

        <!-- Itens -->
        <div id="cart-items-list">
          ${cart.items.map(item => renderCartItem(item)).join('')}
        </div>

        <!-- Endereço de entrega -->
        <div class="card p-4 mt-4" style="border-radius:var(--radius-xl);">
          <div class="row-between">
            <div style="flex:1; min-width:0;">
              <p style="font-size:var(--text-2xs); font-weight:var(--weight-semibold); color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px;">
                📍 Endereço de entrega
              </p>
              <p class="font-semibold text-sm" id="cart-address-text" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${user.address || 'Selecione um endereço'}
              </p>
              ${user.addressData?.complemento ? `<p class="text-muted text-xs">${user.addressData.complemento}</p>` : ''}
            </div>
            <button class="btn btn-ghost btn-sm ml-3" id="cart-change-addr-btn" type="button" style="flex-shrink:0;">
              Alterar
            </button>
          </div>
          <div class="divider" style="margin:var(--space-3) 0; opacity:.3;"></div>
          <div class="flex items-center gap-2">
            <span style="font-size:16px;" aria-hidden="true">🕐</span>
            <p class="text-sm">Tempo estimado: <span class="font-semibold">${user.estimatedTime}</span></p>
          </div>
        </div>

        <!-- Observações -->
        <div class="card p-4 mt-3" style="border-radius:var(--radius-xl);">
          <label class="input-label" for="cart-notes">📝 Observações</label>
          <textarea
            id="cart-notes"
            class="input mt-2"
            placeholder="Ex: sem cebola, ponto bem passado, campainha não funciona..."
            rows="2"
            style="resize:none; border-radius:var(--radius-md); font-size:var(--text-sm);"
          ></textarea>
        </div>

        <!-- Método de pagamento -->
        <div class="card p-4 mt-3" style="border-radius:var(--radius-xl);">
          <p class="input-label mb-3">💳 Forma de pagamento</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-2);" id="payment-grid">
            ${PAYMENT_METHODS.map(pm => `
              <button
                class="card p-3 press-effect text-left ${pm.id === selectedPayment ? 'border-primary' : ''}"
                data-payment="${pm.id}"
                type="button"
                style="
                  border-radius:var(--radius-lg);
                  cursor:pointer;
                  ${pm.id === selectedPayment ? 'border-color:var(--color-primary);background:var(--color-primary-alpha-10);' : ''}
                "
                aria-pressed="${pm.id === selectedPayment}"
              >
                <p style="font-size:20px; margin-bottom:4px;" aria-hidden="true">${pm.icon}</p>
                <p class="font-semibold text-sm ${pm.id === selectedPayment ? 'text-brand' : ''}">${pm.label}</p>
                <p class="text-muted text-xs">${pm.desc}</p>
              </button>
            `).join('')}
          </div>

          ${selectedPayment === 'cash' ? `
            <div class="mt-3" id="cash-change-wrap">
              <label class="input-label" for="cart-change">Troco para quanto?</label>
              <input
                id="cart-change"
                class="input mt-2"
                type="number"
                placeholder="Ex: 100,00"
                min="${total.toFixed(2)}"
                step="0.01"
                style="font-size:var(--text-sm);"
              />
            </div>
          ` : ''}

          ${selectedPayment === 'pix' ? `
            <div class="mt-3 p-3" style="background:rgba(67,160,71,.08); border-radius:var(--radius-md); border:1px solid rgba(67,160,71,.2);">
              <p class="text-success text-xs font-semibold">⚡ Desconto Pix de 5% aplicado automaticamente!</p>
            </div>
          ` : ''}
        </div>

        <!-- Cupom -->
        <div class="card p-4 mt-3" style="border-radius:var(--radius-xl);">
          <div class="flex gap-2">
            <input
              class="input flex-1"
              type="text"
              placeholder="🏷 Cupom de desconto"
              id="cart-coupon"
              style="border-radius:var(--radius-full); font-size:var(--text-sm);"
            />
            <button class="btn btn-outline-primary btn-sm" id="cart-apply-coupon" type="button">
              Aplicar
            </button>
          </div>
        </div>

        <!-- Resumo financeiro -->
        <div class="cart-summary mt-3">
          <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>${formatCurrency(cart.total)}</span>
          </div>
          <div class="cart-summary-row">
            <span>Frete</span>
            <span class="${shipping === 0 ? 'text-success font-semibold' : ''}">
              ${shipping === 0 ? 'Grátis 🎉' : formatCurrency(shipping)}
            </span>
          </div>
          ${pixDiscount > 0 ? `
            <div class="cart-summary-row">
              <span>Desconto Pix (5%)</span>
              <span class="text-success">− ${formatCurrency(pixDiscount)}</span>
            </div>
          ` : ''}
          <div class="cart-summary-row total">
            <span>Total</span>
            <span class="cart-summary-value">${formatCurrency(total)}</span>
          </div>
        </div>

        <!-- Upsell -->
        ${renderUpsell()}

        <!-- Checkout -->
        <button
          class="btn btn-primary btn-full btn-lg mt-4"
          id="cart-checkout-btn"
          type="button"
        >
          Ir para o Checkout — ${formatCurrency(total)}
        </button>

        <button class="btn btn-ghost btn-full mt-2 mb-4" id="cart-continue-btn" type="button">
          ← Continuar comprando
        </button>

        <div style="height:var(--space-8);"></div>
      </div>
    `;

    setupEvents(cart, total);
  }

  /* ── RENDER ITEM ─────────────────────────────────────────── */
  function renderCartItem(item) {
    const itemTotal = item.price * item.quantity;
    return `
      <div class="cart-item" data-item-id="${item.id}">
        <img
          class="cart-item-image"
          src="${item.image}"
          alt="${item.name}"
          loading="lazy"
          onerror="this.style.background='var(--color-surface-light)';this.alt='';"
        />
        <div class="cart-item-info">
          <h3 class="cart-item-name" style="line-height:1.2;">${item.name}</h3>
          ${item.size ? `<p class="text-muted text-xs mt-1 mb-0.5">Tamanho: ${item.size.label.split(' ')[0]}</p>` : ''}
          ${item.border && item.border.id !== 'sem-borda' ? `<p class="text-muted text-xs mb-0.5">Borda: ${item.border.name}</p>` : ''}
          ${(item.freeAdditions && item.freeAdditions.length > 0) ? `<p class="text-muted text-xs mb-0.5" style="color: #6a1b9a;">Grátis: ${item.freeAdditions.join(', ')}</p>` : ''}
          ${(item.paidAdditions && item.paidAdditions.length > 0) ? `<p class="text-muted text-xs mb-0.5" style="color: #6a1b9a;">Extras: ${item.paidAdditions.map(a => a.name).join(', ')}</p>` : ''}
          ${item.notes ? `<p class="text-muted text-xs mt-1" style="font-style:italic; opacity:0.85;">"${item.notes}"</p>` : ''}
          <p class="cart-item-price mt-1">${formatCurrency(item.price)}<span class="text-muted text-xs"> /un</span></p>
        </div>
        <div class="cart-item-controls" style="align-items:flex-end;">
          <p class="cart-item-total mb-2">${formatCurrency(itemTotal)}</p>
          <div class="qty-control">
            <button class="qty-btn" data-action="decrease" data-item-id="${item.id}" aria-label="Remover 1 ${item.name}" type="button">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" data-action="increase" data-item-id="${item.id}" aria-label="Adicionar 1 ${item.name}" type="button">+</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ── UPSELL ──────────────────────────────────────────────── */
  function renderUpsell() {
    const upsellProducts = upsellProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 3);

    if (!upsellProducts.length) return '';

    return `
      <div class="mt-5">
        <p class="section-title mb-3" style="font-size:var(--text-base);">
          🍹 Complete seu pedido
        </p>
        <div style="display:flex; gap:var(--space-3); overflow-x:auto; padding-bottom:var(--space-2); scrollbar-width:none;">
          ${upsellProducts.map(p => `
            <div style="min-width:140px; flex-shrink:0;">
              <div class="card" style="border-radius:var(--radius-xl); overflow:hidden; cursor:pointer;" data-upsell-id="${p.id}">
                <img src="${p.image}" alt="${p.name}" style="width:100%; height:80px; object-fit:cover;" loading="lazy"/>
                <div style="padding:var(--space-2) var(--space-3);">
                  <p class="font-semibold" style="font-size:var(--text-xs); line-height:1.2;">${p.name}</p>
                  <p class="text-brand font-bold" style="font-size:var(--text-xs); margin-top:4px;">${formatCurrency(p.price)}</p>
                  <button
                    class="btn btn-primary btn-sm btn-full mt-2"
                    data-upsell-add="${p.id}"
                    type="button"
                    style="font-size:10px; padding:4px 8px;"
                  >+ Adicionar</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ── EMPTY ───────────────────────────────────────────────── */
  function renderEmpty() {
    if (!element) return;
    element.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h1 class="cart-empty-title">Carrinho vazio</h1>
        <p class="cart-empty-desc">Explore nosso cardápio e escolha seus favoritos!</p>
        <button class="btn btn-primary mt-6" id="cart-go-catalog-btn" type="button">
          📋 Ver cardápio completo
        </button>
      </div>
    `;
    element.querySelector('#cart-go-catalog-btn')?.addEventListener('click', () => navigate('#catalog'));
  }

  /* ── EVENTS ──────────────────────────────────────────────── */
  function setupEvents(cart, total) {
    if (!element) return;

    // Quantidade
    element.querySelector('#cart-items-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const itemId = btn.dataset.itemId;
      const item = cart.items.find(i => i.id === itemId);
      if (!item) return;
      if (btn.dataset.action === 'increase') {
        store.dispatch('UPDATE_QUANTITY', { id: itemId, quantity: item.quantity + 1 });
      } else {
        store.dispatch('UPDATE_QUANTITY', { id: itemId, quantity: item.quantity - 1 });
      }
    });

    // Alterar endereço
    element.querySelector('#cart-change-addr-btn')?.addEventListener('click', openAddressModal);

    // Métodos de pagamento
    element.querySelector('#payment-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-payment]');
      if (!btn) return;
      selectedPayment = btn.dataset.payment;
      render(store.getState().cart);
    });

    // Limpar carrinho
    element.querySelector('#cart-clear-btn')?.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Limpar carrinho?',
        message: 'Todos os itens serão removidos.',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        onConfirm: () => {
          store.dispatch('CLEAR_CART');
          toastSuccess('Carrinho limpo!');
        },
      });
    });

    // Continuar comprando
    element.querySelector('#cart-continue-btn')?.addEventListener('click', () => navigate('#home'));

    // Upsell add
    element.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-upsell-add]');
      if (!btn) return;
      const product = allProducts.find(p => p.id === btn.dataset.upsellAdd);
      if (!product) return;
      store.dispatch('ADD_TO_CART', { id: product.id, name: product.name, price: product.price, image: product.image });
      toastSuccess('Adicionado!', product.name);
    });

    // Cupom
    element.querySelector('#cart-apply-coupon')?.addEventListener('click', handleCoupon);

    // Checkout
    element.querySelector('#cart-checkout-btn')?.addEventListener('click', () => handleCheckout(cart, total));
  }

  /* ── COUPON ──────────────────────────────────────────────── */
  function handleCoupon() {
    const code = element?.querySelector('#cart-coupon')?.value?.trim().toUpperCase();
    if (!code) return;
    if (code === 'FLOW30') {
      toastSuccess('Cupom aplicado! 🎉', '30% de desconto ativado.');
    } else if (code === 'FRETE') {
      toastSuccess('Frete grátis! 🚚', 'Cupom de frete grátis ativado.');
    } else {
      toastError('Cupom inválido', 'Tente: FLOW30 ou FRETE');
    }
  }

  /* ── CHECKOUT ────────────────────────────────────────────── */
  function handleCheckout() {
    navigate('#checkout');
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    unsubscribeCart?.();
    element = null;
  }

  return { mount, destroy };
}
