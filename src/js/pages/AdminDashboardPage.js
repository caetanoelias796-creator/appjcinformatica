/**
 * PizzaFlow — Painel Administrativo: Dashboard Funcional
 * Implementação completa com atualização em tempo real,
 * tratamento de erros, skeletons e design premium estilo SaaS.
 */

import { fetchDashboardMetrics } from '@services/api.js';
import { formatCurrency } from '@utils/formatters.js';
import { toastSuccess, toastError } from '@components/Toast.js';

export default function AdminDashboardPage() {
  let element = null;
  let data = null;
  let refreshInterval = null;
  let isLoading = false;

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'admin-dashboard-container';

    injectStyles();
    container.appendChild(element);

    await loadDashboardData();

    // Configura o pooling automático a cada 30 segundos
    refreshInterval = setInterval(() => {
      loadDashboardData(true); // Atualiza silenciosamente ou com carregamento sutil
    }, 30000);

    return { destroy };
  }

  /* ── CARREGAR DADOS DO DASHBOARD ────────────────────────── */
  async function loadDashboardData(isSilent = false) {
    if (isLoading) return;
    if (!isSilent) {
      isLoading = true;
      renderSkeleton();
    }

    try {
      // Consome o DashboardService via wrapper API
      const metrics = await fetchDashboardMetrics({
        companyId: 'c51b18d2-4322-4bb3-be9d-f5e6b72a912e'
      });
      data = metrics;
      isLoading = false;
      render();
      setupEvents();
    } catch (err) {
      console.error('[AdminDashboard] Erro ao carregar métricas:', err);
      isLoading = false;
      if (!isSilent) {
        renderError();
      } else {
        toastError('Conexão', 'Falha ao atualizar dados em tempo real.');
      }
    }
  }

  /* ── ESTILOS EM ESCOPO (PREMIUM SAAS DESIGN) ─────────────── */
  function injectStyles() {
    if (document.getElementById('admin-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-dashboard-styles';
    style.textContent = `
      /* Esconde o Bottom Nav e o Floating Cart de Clientes quando o Dashboard Administrativo estiver na tela */
      body:has(.admin-dashboard-container) #bottom-nav,
      body:has(.admin-dashboard-container) #floating-cart {
        display: none !important;
      }

      .admin-dashboard-container {
        display: flex;
        min-height: 100vh;
        background: #F8FAFC;
        font-family: var(--font-primary);
        color: var(--color-text-primary);
      }

      /* MENU LATERAL (SIDEBAR) */
      .admin-sidebar {
        width: 260px;
        background: #FFFFFF;
        border-right: 1px solid var(--color-border);
        display: flex;
        flex-direction: column;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        z-index: 100;
        transition: transform var(--transition-normal);
      }
      
      .sidebar-logo {
        padding: var(--space-5) var(--space-6);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        border-bottom: 1px solid var(--color-border);
      }
      .logo-emoji {
        font-size: var(--text-lg);
      }
      .logo-text {
        font-weight: var(--weight-black);
        font-size: var(--text-md);
        color: var(--color-text-primary);
        letter-spacing: -0.02em;
      }
      .logo-badge {
        font-size: 9px;
        background: rgba(2, 132, 199, 0.1);
        color: var(--color-primary);
        padding: 1px 4px;
        border-radius: var(--radius-sm);
        font-weight: var(--weight-bold);
      }

      .sidebar-nav {
        flex: 1;
        padding: var(--space-4) var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        overflow-y: auto;
      }

      .nav-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .nav-section-title {
        font-size: 10px;
        font-weight: var(--weight-bold);
        text-transform: uppercase;
        color: var(--color-text-muted);
        letter-spacing: 0.05em;
        padding: var(--space-2) var(--space-3);
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        font-weight: var(--weight-medium);
        text-decoration: none;
        transition: all var(--transition-fast);
      }
      .nav-link:hover {
        background: #F1F5F9;
        color: var(--color-text-primary);
      }
      .nav-link.active {
        background: rgba(2, 132, 199, 0.08);
        color: var(--color-primary);
        font-weight: var(--weight-semibold);
      }
      .nav-link-badge {
        margin-left: auto;
        background: var(--color-primary);
        color: #FFFFFF;
        font-size: 9px;
        padding: 2px 6px;
        border-radius: var(--radius-full);
        font-weight: var(--weight-bold);
      }

      /* AREA PRINCIPAL */
      .admin-main-layout {
        flex: 1;
        margin-left: 260px;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      /* TOPO / HEADER */
      .admin-top-header {
        height: 64px;
        background: #FFFFFF;
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-6);
        position: sticky;
        top: 0;
        z-index: 90;
      }

      .btn-hamburger {
        display: none;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--color-text-primary);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .company-name {
        font-weight: var(--weight-bold);
        font-size: var(--text-sm);
        color: var(--color-text-primary);
      }
      .store-status-badge {
        font-size: 10px;
        font-weight: var(--weight-bold);
        padding: 2px 8px;
        border-radius: var(--radius-full);
      }
      .store-status-badge.open {
        background: rgba(16, 185, 129, 0.1);
        color: #10B981;
      }
      .store-status-badge.closed {
        background: rgba(239, 68, 68, 0.1);
        color: #EF4444;
      }

      .header-center {
        max-width: 380px;
        width: 100%;
        margin: 0 var(--space-4);
      }
      .search-container {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: 12px;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }
      .search-bar-input {
        width: 100%;
        padding: 8px 12px 8px 32px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        background: #F8FAFC;
        transition: border var(--transition-fast);
      }
      .search-bar-input:focus {
        border-color: var(--color-primary);
        background: #FFFFFF;
        outline: none;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }
      .header-action-btn {
        background: none;
        border: none;
        font-size: var(--text-sm);
        cursor: pointer;
        position: relative;
        padding: var(--space-1);
        color: var(--color-text-secondary);
      }
      .badge-dot {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 6px;
        height: 6px;
        background: var(--color-primary);
        border-radius: 50%;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-full);
        object-fit: cover;
      }
      .user-details {
        display: none;
      }
      @media (min-width: 768px) {
        .user-details {
          display: flex;
          flex-direction: column;
        }
      }
      .user-name {
        font-weight: var(--weight-bold);
        font-size: var(--text-2xs);
        color: var(--color-text-primary);
        line-height: 1.1;
      }
      .user-role {
        font-size: 9px;
        color: var(--color-text-muted);
      }

      /* DASHBOARD CONTENT */
      .dashboard-body {
        padding: var(--space-6);
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      /* CARDS DE MÉTRICAS */
      .kpis-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-4);
      }
      @media (min-width: 576px) {
        .kpis-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1200px) {
        .kpis-grid {
          grid-template-columns: repeat(5, 1fr); /* 4 KPIs + 1 Loja */
        }
      }

      .kpi-card {
        background: #FFFFFF;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        box-shadow: var(--shadow-sm);
        transition: transform var(--transition-fast), box-shadow var(--transition-fast);
      }
      .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      .kpi-title {
        font-size: 10px;
        font-weight: var(--weight-bold);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .kpi-value {
        font-weight: var(--weight-black);
        font-size: var(--text-xl);
        color: var(--color-text-primary);
        letter-spacing: -0.03em;
        line-height: 1.1;
      }
      .kpi-spark {
        font-size: 9px;
        color: #10B981;
        font-weight: var(--weight-semibold);
        display: flex;
        align-items: center;
        gap: 2px;
      }

      /* OPERAÇÃO (ESTEIRA KDS) */
      .production-box {
        background: #FFFFFF;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        box-shadow: var(--shadow-sm);
      }
      .production-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }
      .production-title {
        font-family: var(--font-primary);
        font-weight: var(--weight-bold);
        font-size: var(--text-sm);
      }

      .production-pipeline {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }
      @media (min-width: 768px) {
        .production-pipeline {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      .pipeline-step {
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        text-align: center;
        transition: transform var(--transition-fast);
      }
      .pipeline-step:hover {
        transform: translateY(-1px);
      }
      .pipeline-step.step-new { background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.15); color: #EF4444; }
      .pipeline-step.step-prep { background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.15); color: #F59E0B; }
      .pipeline-step.step-oven { background: rgba(217, 119, 6, 0.06); border: 1px solid rgba(217, 119, 6, 0.15); color: #D97706; }
      .pipeline-step.step-ready { background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); color: #10B981; }
      .pipeline-step.step-delivery { background: rgba(2, 132, 199, 0.06); border: 1px solid rgba(2, 132, 199, 0.15); color: #0284C7; }

      .step-count {
        font-size: var(--text-lg);
        font-weight: var(--weight-black);
      }
      .step-label {
        font-size: 10px;
        font-weight: var(--weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        opacity: 0.8;
      }

      /* TABELA DE PEDIDOS */
      .orders-box {
        background: #FFFFFF;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        box-shadow: var(--shadow-sm);
      }
      .orders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }
      .orders-title {
        font-family: var(--font-primary);
        font-weight: var(--weight-bold);
        font-size: var(--text-sm);
      }

      .table-responsive {
        width: 100%;
        overflow-x: auto;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
      }

      .dashboard-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        min-width: 600px;
      }
      .dashboard-table th, .dashboard-table td {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border);
        font-size: var(--text-xs);
      }
      .dashboard-table th {
        background: #F8FAFC;
        font-weight: var(--weight-bold);
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-size: 10px;
        letter-spacing: 0.05em;
      }
      .dashboard-table tr:last-child td {
        border-bottom: none;
      }
      .dashboard-table tbody tr {
        transition: background var(--transition-fast);
      }
      .dashboard-table tbody tr:hover {
        background: #F8FAFC;
      }

      /* BADGES DE PEDIDOS */
      .badge-status {
        font-size: 9px;
        font-weight: var(--weight-bold);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        text-transform: uppercase;
        display: inline-block;
      }
      .badge-status.pending { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
      .badge-status.preparing { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
      .badge-status.oven { background: rgba(217, 119, 6, 0.1); color: #D97706; }
      .badge-status.ready { background: rgba(16, 185, 129, 0.1); color: #10B981; }
      .badge-status.out_for_delivery { background: rgba(2, 132, 199, 0.1); color: #0284C7; }
      .badge-status.delivered { background: #E2E8F0; color: var(--color-text-secondary); }

      /* RESPONSIVIDADE E TOGGLE SIDEBAR */
      @media (max-width: 1024px) {
        .admin-sidebar {
          transform: translateX(-100%);
        }
        .admin-sidebar.sidebar-open {
          transform: translateX(0);
        }
        .admin-main-layout {
          margin-left: 0;
        }
        .btn-hamburger {
          display: block;
        }
      }

      /* Skeletons */
      .skeleton-kpi {
        height: 100px;
        border-radius: var(--radius-xl);
      }
    `;
    document.head.appendChild(style);
  }

  /* ── RENDER SKELETON ────────────────────────────────────── */
  function renderSkeleton() {
    if (!element) return;
    element.innerHTML = `
      <div class="admin-sidebar">
        <div class="sidebar-logo">
          <span class="logo-emoji">🍕</span>
          <span class="logo-text">PizzaFlow</span>
        </div>
      </div>
      <div class="admin-main-layout">
        <div class="admin-top-header">
          <div class="skeleton" style="width: 150px; height: 24px;"></div>
          <div class="skeleton" style="width: 250px; height: 32px; border-radius: var(--radius-full);"></div>
        </div>
        <div class="dashboard-body">
          <div class="kpis-grid">
            <div class="skeleton skeleton-kpi"></div>
            <div class="skeleton skeleton-kpi"></div>
            <div class="skeleton skeleton-kpi"></div>
            <div class="skeleton skeleton-kpi"></div>
            <div class="skeleton skeleton-kpi"></div>
          </div>
          <div class="skeleton" style="height: 150px; border-radius: var(--radius-xl);"></div>
          <div class="skeleton" style="height: 250px; border-radius: var(--radius-xl);"></div>
        </div>
      </div>
    `;
  }

  /* ── RENDER COMPLETO ─────────────────────────────────────── */
  function render() {
    if (!element || !data) return;

    const { kpis, productionCounts, recentOrders } = data;

    element.innerHTML = `
      <!-- MENU LATERAL (SIDEBAR) -->
      <aside class="admin-sidebar" id="sidebar-menu">
        <div class="sidebar-logo">
          <span class="logo-emoji">🍕</span>
          <span class="logo-text">PizzaFlow</span>
          <span class="logo-badge">SaaS</span>
        </div>
        
        <nav class="sidebar-nav">
          <div class="nav-group">
            <a href="#admin-dashboard" class="nav-link active">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Dashboard</span>
            </a>
          </div>

          <div class="nav-group">
            <div class="nav-section-title">Catálogo</div>
            <a href="#admin-products" class="nav-link">
              <span class="nav-icon">🍔</span>
              <span class="nav-label">Produtos</span>
            </a>
            <a href="#admin-categories" class="nav-link">
              <span class="nav-icon">📁</span>
              <span class="nav-label">Categorias</span>
            </a>
            <a href="#admin-flavors" class="nav-link">
              <span class="nav-icon">🌶️</span>
              <span class="nav-label">Sabores</span>
            </a>
          </div>

          <div class="nav-group">
            <div class="nav-section-title">Operações</div>
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">🛒</span>
              <span class="nav-label">Pedidos</span>
              <span class="nav-link-badge">5</span>
            </a>
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">🍳</span>
              <span class="nav-label">Kitchen</span>
            </a>
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">🛵</span>
              <span class="nav-label">Entregas</span>
            </a>
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">👥</span>
              <span class="nav-label">Clientes</span>
            </a>
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">💵</span>
              <span class="nav-label">Caixa</span>
            </a>
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">📈</span>
              <span class="nav-label">Relatórios</span>
            </a>
          </div>

          <div class="nav-group" style="margin-top: auto;">
            <a href="#admin-dashboard" class="nav-link alert-link">
              <span class="nav-icon">⚙️</span>
              <span class="nav-label">Configurações</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- ÁREA PRINCIPAL -->
      <div class="admin-main-layout">
        <!-- TOPO / HEADER -->
        <header class="admin-top-header">
          <div class="header-left">
            <button class="btn-hamburger" id="hamburger-menu-btn" type="button">☰</button>
            <span class="company-name">PizzaFlow Matrix</span>
            <span class="store-status-badge ${kpis.isOpen ? 'open' : 'closed'}">
              ${kpis.isOpen ? '🟢 Aberta' : '🔴 Fechada'}
            </span>
          </div>

          <div class="header-center">
            <div class="search-container">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-bar-input" id="dashboard-search-input" placeholder="Pesquisar pedido ou cliente..." />
            </div>
          </div>

          <div class="header-right">
            <button class="header-action-btn" id="btn-notifications" type="button" aria-label="Notificações">
              🔔 <span class="badge-dot"></span>
            </button>
            
            <div class="user-profile">
              <img class="user-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Elias Caetano" />
              <div class="user-details">
                <span class="user-name">Elias Caetano</span>
                <span class="user-role">Administrador</span>
              </div>
            </div>
          </div>
        </header>

        <!-- DASHBOARD BODY -->
        <main class="dashboard-body">
          <!-- Grid de Métricas / KPIs -->
          <div class="kpis-grid">
            <div class="kpi-card">
              <span class="kpi-title">Pedidos Hoje</span>
              <span class="kpi-value">${kpis.todayOrdersCount}</span>
              <span class="kpi-spark">📈 +12% vs ontem</span>
            </div>

            <div class="kpi-card">
              <span class="kpi-title">Faturamento</span>
              <span class="kpi-value">${formatCurrency(kpis.todayRevenueSum)}</span>
              <span class="kpi-spark">📈 +8.5% vs ontem</span>
            </div>

            <div class="kpi-card">
              <span class="kpi-title">Ticket Médio</span>
              <span class="kpi-value">${formatCurrency(kpis.averageTicket)}</span>
              <span class="kpi-spark" style="color: var(--color-text-muted);">📊 Estável</span>
            </div>

            <div class="kpi-card">
              <span class="kpi-title">Tempo Médio (Prep)</span>
              <span class="kpi-value">${kpis.averagePrepTime} min</span>
              <span class="kpi-spark" style="color: #10B981;">⚡ -2 min vs ontem</span>
            </div>

            <div class="kpi-card">
              <span class="kpi-title">Loja Status</span>
              <span class="kpi-value" style="font-size: var(--text-md); margin-top: var(--space-1);">
                ${kpis.isOpen ? '🟢 Aberta' : '🔴 Fechada'}
              </span>
              <span class="kpi-spark" style="color: var(--color-text-muted); font-size: 8px;">
                Baseado no Horário de Funcionamento
              </span>
            </div>
          </div>

          <!-- Operação / KDS Pipeline -->
          <div class="production-box">
            <div class="production-header">
              <h2 class="production-title">Esteira de Produção</h2>
              <button class="btn btn-ghost btn-sm" id="btn-refresh-dashboard" type="button" style="padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">
                🔄 Atualizar
              </button>
            </div>
            <div class="production-pipeline">
              <div class="pipeline-step step-new">
                <span class="step-count">${productionCounts.novos}</span>
                <span class="step-label">Novos</span>
              </div>
              <div class="pipeline-step step-prep">
                <span class="step-count">${productionCounts.preparo}</span>
                <span class="step-label">Em preparo</span>
              </div>
              <div class="pipeline-step step-oven">
                <span class="step-count">${productionCounts.forno}</span>
                <span class="step-label">No forno</span>
              </div>
              <div class="pipeline-step step-ready">
                <span class="step-count">${productionCounts.prontos}</span>
                <span class="step-label">Prontos</span>
              </div>
              <div class="pipeline-step step-delivery">
                <span class="step-count">${productionCounts.entrega}</span>
                <span class="step-label">Em entrega</span>
              </div>
            </div>
          </div>

          <!-- Tabela de Últimos Pedidos -->
          <div class="orders-box">
            <div class="orders-header">
              <h2 class="orders-title">Pedidos Recentes</h2>
            </div>
            <div class="table-responsive">
              <table class="dashboard-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Horário</th>
                  </tr>
                </thead>
                <tbody id="dashboard-orders-tbody">
                  ${recentOrders.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align: center; color: var(--color-text-muted);">Nenhum pedido localizado hoje.</td>
                    </tr>
                  ` : recentOrders.map(o => `
                    <tr>
                      <td><strong>#${o.shortId || o.id}</strong></td>
                      <td>${escapeHtml(o.customerName)}</td>
                      <td>
                        <span style="font-size: 10px; font-weight: var(--weight-bold); color: var(--color-text-secondary);">
                          ${o.type === 'DELIVERY' ? '🛵 Entrega' : '🥡 Retirada'}
                        </span>
                      </td>
                      <td>
                        <span class="badge-status ${o.status.toLowerCase()}">${o.status}</span>
                      </td>
                      <td><strong style="color: var(--color-primary);">${formatCurrency(o.total)}</strong></td>
                      <td style="color: var(--color-text-muted);">${o.time}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  /* ── REGISTRO DE EVENTOS DA PÁGINA ──────────────────────── */
  function setupEvents() {
    if (!element) return;

    // Toggle Sidebar em telas menores
    const sidebar = element.querySelector('#sidebar-menu');
    element.querySelector('#hamburger-menu-btn')?.addEventListener('click', () => {
      sidebar?.classList.toggle('sidebar-open');
    });

    // Fechar menu se clicar fora dele (em mobile)
    element.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        const hamburgerBtn = element.querySelector('#hamburger-menu-btn');
        if (sidebar?.classList.contains('sidebar-open') && 
            !sidebar.contains(e.target) && 
            !hamburgerBtn.contains(e.target)) {
          sidebar.classList.remove('sidebar-open');
        }
      }
    });

    // Botões de Ações e Alertas
    element.querySelectorAll('.alert-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        toastSuccess('Módulo Operacional', 'Este recurso fará parte de uma sprint operacional futura.');
      });
    });

    element.querySelector('#btn-notifications')?.addEventListener('click', () => {
      toastSuccess('Notificações', 'Você não possui novas notificações no momento.');
    });

    // Clique no botão Atualizar
    element.querySelector('#btn-refresh-dashboard')?.addEventListener('click', () => {
      loadDashboardData();
    });

    // Pesquisa simples reativa na tabela de pedidos
    const searchInput = element.querySelector('#dashboard-search-input');
    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = element.querySelectorAll('#dashboard-orders-tbody tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  /* ── RENDER ERRO INDISPONIBILIDADE DA API ─────────────────── */
  function renderError() {
    if (!element) return;
    element.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) var(--space-6); background: #F8FAFC; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 64px; margin-bottom: var(--space-4);">📡</p>
        <h3 style="font-family: var(--font-primary); font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-primary); margin-bottom: var(--space-2);">
          Sem Conexão com o Servidor
        </h3>
        <p style="color: var(--color-text-muted); font-size: var(--text-sm); max-width: 400px; margin-bottom: var(--space-6);">
          O serviço do dashboard está temporariamente indisponível. Verifique se o backend está ligado ou tente novamente.
        </p>
        <button class="btn btn-primary" id="btn-retry-dashboard" type="button">🔄 Tentar Novamente</button>
      </div>
    `;

    element.querySelector('#btn-retry-dashboard')?.addEventListener('click', () => {
      loadDashboardData();
    });
  }

  /* ── ESCAPAR HTML ────────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    element = null;
    data = null;
  }

  return { mount, destroy };
}
