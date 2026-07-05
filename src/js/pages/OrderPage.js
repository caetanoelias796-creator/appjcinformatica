/**
 * PizzaFlow — Orders Page
 * Página de pedidos e histórico. Também serve de placeholder para Perfil.
 */

import { navigate } from '@router/router.js';
import { store }    from '@store/store.js';
import { fetchOrders } from '@services/api.js';
import { formatCurrency, formatDateTime } from '@utils/formatters.js';

/* ==========================================================================
   FACTORY DA PÁGINA
   ========================================================================== */

export default function OrderPage() {
  let element = null;

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page';

    container.appendChild(element);

    // Skeleton
    element.innerHTML = renderSkeleton();

    try {
      const orders = await fetchOrders();
      render(orders);
    } catch {
      render([]);
    }

    return { destroy };
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render(orders) {
    if (!element) return;

    element.innerHTML = `
      <div style="padding: var(--space-5) var(--content-padding-x) 0;">

        <!-- Header -->
        <h1 class="font-primary font-black" style="font-size: var(--text-2xl); margin-bottom: var(--space-2);">
          Meus Pedidos
        </h1>
        <p class="text-secondary text-sm mb-6">Histórico e acompanhamento dos seus pedidos</p>

        ${orders.length === 0 ? renderEmpty() : renderOrdersList(orders)}

      </div>
    `;

    setupEvents();
  }

  /* ── RENDER LISTA ─────────────────────────────────────────── */
  function renderOrdersList(orders) {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        ${orders.map(order => renderOrderCard(order)).join('')}
      </div>
    `;
  }

  function renderOrderCard(order) {
    const statusConfig = getStatusConfig(order.status);

    return `
      <div class="card" style="border-radius: var(--radius-xl); overflow: hidden;">
        <!-- Status bar -->
        <div style="height: 4px; background: ${statusConfig.color};"></div>

        <div class="card-body">
          <div class="row-between mb-3">
            <div>
              <p class="font-primary font-bold text-sm">Pedido #${order.id}</p>
              <p class="text-muted text-xs mt-1">${formatDateTime(order.createdAt)}</p>
            </div>
            <span class="badge" style="background: ${statusConfig.bg}; color: ${statusConfig.color};">
              ${statusConfig.icon} ${statusConfig.label}
            </span>
          </div>

          <!-- Items -->
          <div style="display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-3);">
            ${order.items?.slice(0, 3).map(item => `
              <div class="flex items-center gap-2">
                <span class="text-muted text-xs">${item.quantity}×</span>
                <span class="text-sm truncate">${item.name}</span>
              </div>
            `).join('') || ''}
            ${order.items?.length > 3 ? `<p class="text-muted text-xs">+${order.items.length - 3} itens</p>` : ''}
          </div>

          <div class="row-between">
            <div>
              <p class="text-muted text-xs">Total do pedido</p>
              <p class="font-primary font-bold text-base text-brand">
                ${formatCurrency(order.items?.reduce((acc, i) => acc + i.price * i.quantity, 0) || 0)}
              </p>
            </div>
            <button
              class="btn btn-ghost btn-sm"
              data-order-id="${order.id}"
              type="button"
            >
              Ver detalhes
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ── RENDER EMPTY ─────────────────────────────────────────── */
  function renderEmpty() {
    return `
      <div class="cart-empty" style="padding: var(--space-16) 0;">
        <div class="cart-empty-icon">📋</div>
        <h2 class="cart-empty-title">Nenhum pedido ainda</h2>
        <p class="cart-empty-desc">
          Faça seu primeiro pedido e ele aparecerá aqui!
        </p>

        <!-- Onboarding Steps -->
        <div style="
          width: 100%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          margin-top: var(--space-6);
          text-align: left;
        ">
          <p class="font-primary font-bold text-sm mb-4 text-center">Como funciona?</p>
          ${[
            { step: '1', icon: '🍕', title: 'Escolha sua pizza', desc: 'Explore nosso cardápio completo' },
            { step: '2', icon: '🛒', title: 'Adicione ao carrinho', desc: 'Monte seu pedido como quiser' },
            { step: '3', icon: '🚀', title: 'Finalize o pedido', desc: 'Confirme e aguarde a entrega' },
          ].map(item => `
            <div class="flex items-center gap-4 mb-4">
              <div style="
                width: 44px; height: 44px;
                background: var(--color-primary-alpha-10);
                border: 1px solid var(--color-primary-alpha-30);
                border-radius: var(--radius-full);
                display: flex; align-items: center; justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
              ">${item.icon}</div>
              <div>
                <p class="font-semibold text-sm">${item.title}</p>
                <p class="text-muted text-xs">${item.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <button
          class="btn btn-primary mt-4"
          id="orders-go-home-btn"
          type="button"
        >
          🍕 Fazer meu primeiro pedido
        </button>
      </div>
    `;
  }

  /* ── SKELETON ─────────────────────────────────────────────── */
  function renderSkeleton() {
    return `
      <div style="padding: var(--space-5) var(--content-padding-x) 0;" aria-busy="true">
        <div class="skeleton skeleton-title mb-2" style="width: 50%;"></div>
        <div class="skeleton skeleton-text mb-6" style="width: 70%;"></div>
        ${Array(3).fill('').map(() => `
          <div class="card mb-4" style="border-radius: var(--radius-xl); overflow: hidden;">
            <div class="skeleton" style="height: 4px;"></div>
            <div class="card-body">
              <div class="skeleton skeleton-text mb-2" style="width: 40%;"></div>
              <div class="skeleton skeleton-text mb-2" style="width: 60%;"></div>
              <div class="skeleton skeleton-text" style="width: 30%;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    element?.querySelector('#orders-go-home-btn')?.addEventListener('click', () => {
      navigate('#home');
    });
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  function getStatusConfig(status) {
    const configs = {
      'confirmed': { label: 'Confirmado', icon: '✅', color: '#43A047', bg: 'rgba(67,160,71,0.15)' },
      'preparing': { label: 'Preparando', icon: '👨‍🍳', color: '#FFC107', bg: 'rgba(255,193,7,0.15)' },
      'delivery':  { label: 'A caminho',  icon: '🛵', color: '#1E88E5', bg: 'rgba(30,136,229,0.15)' },
      'delivered': { label: 'Entregue',   icon: '🏠', color: '#43A047', bg: 'rgba(67,160,71,0.15)' },
      'cancelled': { label: 'Cancelado',  icon: '❌', color: '#E53935', bg: 'rgba(229,57,53,0.15)' },
    };
    return configs[status] ?? configs['confirmed'];
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    element = null;
  }

  return { mount, destroy };
}
