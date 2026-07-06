/**
 * PizzaFlow — CartDrawer Component
 * Modal lateral (Desktop: Side Panel, Mobile: Bottom Sheet) contendo o fluxo do carrinho.
 */

import { CartStore } from '@/core/CartStore.js';
import { EventBus } from '@/core/EventBus.js';
import { formatCurrency } from '@utils/formatters.js';

import { EmptyCart } from './EmptyCart.js';
import { CartItemCard } from './CartItemCard.js';
import { CartSummary } from './CartSummary.js';
import { CouponInput } from './CouponInput.js';
import { ShippingCard } from './ShippingCard.js';

import './cartDrawer.css';

let _isOpen = false;
let _backdrop = null;
let _container = null;
let _unsubscribeCart = null;

// Sub-componentes
let _summary = null;
let _couponInput = null;
let _shippingCard = null;

/**
 * Abre o Drawer do Carrinho
 */
export function openCartDrawer() {
  if (_isOpen) return;

  // Cria e anexa o backdrop do drawer ao body
  _backdrop = document.createElement('div');
  _backdrop.className = 'cart-drawer-backdrop';
  _backdrop.id = 'cart-drawer-backdrop';
  _backdrop.setAttribute('role', 'presentation');

  _container = document.createElement('div');
  _container.className = 'cart-drawer-container';
  _container.id = 'cart-drawer-container';
  _container.setAttribute('role', 'dialog');
  _container.setAttribute('aria-modal', 'true');
  _container.setAttribute('aria-label', 'Carrinho de compras');
  _container.setAttribute('tabindex', '-1');

  _backdrop.appendChild(_container);
  document.body.appendChild(_backdrop);

  _isOpen = true;

  // Renderiza base do Drawer
  renderBase();
  updateCartView();

  // Inscreve no EventBus para receber atualizações do carrinho
  _unsubscribeCart = EventBus.subscribe('cart:update', () => {
    updateCartView();
  });

  // Eventos de teclado e animação
  setupEvents();

  setTimeout(() => {
    _backdrop.classList.add('open');
    _container.focus();
  }, 30);
}

/**
 * Fecha o Drawer do Carrinho
 */
export function closeCartDrawer() {
  if (!_isOpen || !_backdrop) return;

  _backdrop.classList.remove('open');
  _backdrop.addEventListener('transitionend', () => {
    cleanup();
  }, { once: true });
}

/* ── RENDER BASE ────────────────────────────────────────── */

function renderBase() {
  if (!_container) return;

  _container.innerHTML = `
    <!-- Header -->
    <div class="cart-drawer-header">
      <h2 class="cart-drawer-title">
        <span>🛒 Seu carrinho</span>
      </h2>
      <button class="cart-drawer-close-btn" id="cart-drawer-close" aria-label="Fechar carrinho" type="button">×</button>
    </div>

    <!-- Conteúdo Dinâmico (Lista ou Vazio) -->
    <div class="cart-drawer-content" id="cart-drawer-body">
      <!-- Inserido dinamicamente -->
    </div>

    <!-- Footer (Apenas visível se houver itens) -->
    <div class="cart-drawer-footer" id="cart-drawer-footer" style="display: none;">
      <div id="shipping-card-mount"></div>
      <div id="coupon-input-mount"></div>
      <div id="cart-summary-mount"></div>
      <button class="cart-drawer-submit-btn" id="cart-drawer-submit" type="button">
        Finalizar Pedido
      </button>
    </div>
  `;

  // Instancia e monta sub-componentes fixos do footer
  _shippingCard = ShippingCard({ onChanged: () => updateCartView() });
  _couponInput = CouponInput({ onApplied: () => updateCartView() });
  _summary = CartSummary();

  _container.querySelector('#shipping-card-mount').appendChild(_shippingCard.build());
  _container.querySelector('#coupon-input-mount').appendChild(_couponInput.build());
  _container.querySelector('#cart-summary-mount').appendChild(_summary.build());
}

/* ── ATUALIZAÇÃO DINÂMICA (DIFF ALGORITHM) ───────────────── */

function updateCartView() {
  if (!_container) return;

  const items = CartStore.getItems();
  const body = _container.querySelector('#cart-drawer-body');
  const footer = _container.querySelector('#cart-drawer-footer');

  if (items.length === 0) {
    // Esconde footer e mostra estado vazio
    footer.style.display = 'none';
    body.innerHTML = '';
    const emptyState = EmptyCart({ onClose: closeCartDrawer });
    body.appendChild(emptyState.build());
    return;
  }

  // Mostra footer
  footer.style.display = 'flex';

  // Garante que a estrutura da lista de itens exista no body
  let list = body.querySelector('.cart-drawer-list');
  if (!list) {
    body.innerHTML = '<div class="cart-drawer-list" style="display: flex; flex-direction: column; gap: var(--space-3);" role="list"></div>';
    list = body.querySelector('.cart-drawer-list');
  }

  // 1. Remove elementos DOM que não estão mais no carrinho
  const children = Array.from(list.children);
  children.forEach(child => {
    const id = child.id.replace('cart-item-', '');
    if (!items.some(item => item.id === id)) {
      child.remove();
    }
  });

  // 2. Adiciona novos ou atualiza apenas a quantidade/preço dos existentes (Alta performance!)
  items.forEach(item => {
    const cardId = `cart-item-${item.id}`;
    const existingCard = list.querySelector(`#${cardId}`);

    if (existingCard) {
      const qtyVal = existingCard.querySelector('.cart-item-qty-val');
      const priceVal = existingCard.querySelector('.cart-item-price');
      
      if (qtyVal && parseInt(qtyVal.textContent, 10) !== item.quantity) {
        qtyVal.textContent = item.quantity;
      }
      if (priceVal) {
        priceVal.textContent = formatCurrency(item.totalPrice);
      }
    } else {
      const card = CartItemCard({ item });
      list.appendChild(card.build());
    }
  });

  // Atualiza totais e formulários do footer
  _shippingCard.update();
  _couponInput.update();
  _summary.update();
}

/* ── EVENTOS E ACESSIBILIDADE ───────────────────────────── */

function setupEvents() {
  const closeBtn = _container.querySelector('#cart-drawer-close');
  const submitBtn = _container.querySelector('#cart-drawer-submit');

  closeBtn?.addEventListener('click', closeCartDrawer);

  _backdrop?.addEventListener('click', (e) => {
    if (e.target === _backdrop) closeCartDrawer();
  });

  submitBtn?.addEventListener('click', () => {
    // Alerta informativo: Checkout não implementado conforme requisitos
    alert(`Pedido finalizado no valor de ${formatCurrency(CartStore.getTotal())}! (Funcionalidade de pagamento/checkout não faz parte do escopo)`);
    CartStore.clear();
    closeCartDrawer();
  });

  // Impedir scroll de fundo
  document.body.style.overflow = 'hidden';

  // Teclado (ESC e Focus Trap)
  const handleKeyDown = (e) => {
    if (!_isOpen) {
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    if (e.key === 'Escape') {
      closeCartDrawer();
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    if (e.key === 'Tab') {
      const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusables = _container.querySelectorAll(focusableSelector);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
}

function cleanup() {
  if (_backdrop && _backdrop.parentNode) {
    _backdrop.parentNode.removeChild(_backdrop);
  }

  if (_unsubscribeCart) {
    _unsubscribeCart();
    _unsubscribeCart = null;
  }

  _isOpen = false;
  _backdrop = null;
  _container = null;
  
  _shippingCard = null;
  _couponInput = null;
  _summary = null;

  document.body.style.overflow = '';
}
