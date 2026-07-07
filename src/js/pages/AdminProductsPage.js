/**
 * PizzaFlow — Painel Administrativo de Produtos
 * Oferece controle completo de cadastro, edição, busca, paginação e
 * exclusão de produtos e seus respectivos tamanhos (ProductSize CRUD).
 */

import { store } from '@store/store.js';
import {
  fetchAdminProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct
} from '@services/api.js';
import { showConfirmDialog, showDialog, closeCurrentDialog } from '@components/Dialog.js';
import { toastSuccess, toastError } from '@components/Toast.js';
import { formatCurrency } from '@utils/formatters.js';

export default function AdminProductsPage() {
  let element = null;
  let products = [];
  let categories = [];
  let totalProducts = 0;
  let currentPage = 1;
  let limit = 8;
  let totalPages = 1;
  
  // Filtros correntes
  let searchVal = '';
  let categoryFilter = 'all';
  let statusFilter = 'all'; // all, active, inactive

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page admin-products-page';
    element.style.paddingBottom = 'calc(var(--bottom-nav-height) + 40px)';
    
    // Injeta os estilos premium diretamente na página para evitar dependências extras
    injectStyles();

    container.appendChild(element);

    renderSkeleton();

    try {
      categories = await fetchCategories();
      await loadData();
    } catch (err) {
      console.error('[AdminProducts] Erro ao carregar dados:', err);
      renderError();
    }

    return { destroy };
  }

  /* ── CARREGAR DADOS DA API ─────────────────────────────── */
  async function loadData() {
    try {
      const activeParam = statusFilter === 'all'
        ? undefined
        : statusFilter === 'active';

      const filters = {
        page: currentPage,
        limit,
        search: searchVal,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        active: activeParam,
        companyId: 'c51b18d2-4322-4bb3-be9d-f5e6b72a912e' // Default tenant id para fins demonstrativos
      };

      const res = await fetchAdminProducts(filters);
      products = res.items || [];
      totalProducts = res.total || 0;
      totalPages = res.pages || 1;
      
      render();
      setupEvents();
    } catch (err) {
      toastError('Erro', 'Não foi possível carregar a lista de produtos.');
    }
  }

  /* ── ESTILOS EM ESCOPO ──────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('admin-products-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-products-styles';
    style.textContent = `
      .admin-products-page {
        padding: var(--space-5) var(--content-padding-x);
      }
      .admin-header-row {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-5);
      }
      @media (min-width: 768px) {
        .admin-header-row {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
      }
      .admin-nav-tabs {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }
      .admin-controls-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-5);
      }
      @media (min-width: 576px) {
        .admin-controls-grid {
          grid-template-columns: 2fr 1fr 1fr;
        }
      }
      
      /* Tabela Premium */
      .admin-table-container {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        overflow-x: auto;
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--space-5);
      }
      .admin-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        min-width: 750px;
      }
      .admin-table th, .admin-table td {
        padding: var(--space-4) var(--space-5);
        border-bottom: 1px solid var(--color-border);
        vertical-align: middle;
      }
      .admin-table th {
        background: var(--color-surface-light);
        font-family: var(--font-primary);
        font-weight: var(--weight-bold);
        font-size: var(--text-xs);
        text-transform: uppercase;
        color: var(--color-text-muted);
        letter-spacing: 0.05em;
      }
      .admin-table tr:last-child td {
        border-bottom: none;
      }
      .admin-table tbody tr {
        transition: background-color var(--transition-fast);
      }
      .admin-table tbody tr:hover {
        background-color: var(--color-surface-hover);
      }
      
      /* Produto Info */
      .admin-prod-cell {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .admin-prod-img {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: var(--radius-md);
        background: var(--color-surface-light);
        border: 1px solid var(--color-border);
      }
      .admin-prod-title {
        font-family: var(--font-primary);
        font-weight: var(--weight-semibold);
        color: var(--color-text-primary);
        font-size: var(--text-sm);
      }
      .admin-prod-desc {
        color: var(--color-text-muted);
        font-size: var(--text-2xs);
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Sub CRUD de Tamanhos no formulário */
      .sizes-crud-box {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        background: var(--color-surface-light);
        margin-top: var(--space-2);
      }
      .size-list-item {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr auto;
        gap: var(--space-2);
        align-items: center;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        margin-bottom: var(--space-2);
      }
      .size-form-add {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-2);
        margin-top: var(--space-3);
        border-top: 1px dashed var(--color-border);
        padding-top: var(--space-3);
      }
      @media (min-width: 576px) {
        .size-form-add {
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
        }
      }

      /* Paginação */
      .admin-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) 0;
      }

      /* Badges */
      .badge-type {
        font-size: 10px;
        padding: 2px 6px;
        font-weight: var(--weight-semibold);
        border-radius: var(--radius-sm);
      }
      .badge-type.pizza { background: rgba(229,57,53,0.1); color: #E53935; }
      .badge-type.drink { background: rgba(30,136,229,0.1); color: #1E88E5; }
      .badge-type.dessert { background: rgba(142,36,170,0.1); color: #8E24AA; }
      .badge-type.side { background: rgba(251,140,0,0.1); color: #FB8C00; }
      .badge-type.combo { background: rgba(67,160,71,0.1); color: #43A047; }
    `;
    document.head.appendChild(style);
  }

  /* ── RENDER SKELETON ────────────────────────────────────── */
  function renderSkeleton() {
    if (!element) return;
    element.innerHTML = `
      <div class="admin-header-row">
        <div>
          <div class="skeleton skeleton-title" style="width: 250px;"></div>
          <div class="skeleton skeleton-text mt-2" style="width: 150px;"></div>
        </div>
        <div class="skeleton skeleton-button" style="width: 140px; height: 40px; border-radius: var(--radius-full);"></div>
      </div>
      <div class="admin-controls-grid">
        <div class="skeleton" style="height: 45px; border-radius: var(--radius-full);"></div>
        <div class="skeleton" style="height: 45px; border-radius: var(--radius-full);"></div>
        <div class="skeleton" style="height: 45px; border-radius: var(--radius-full);"></div>
      </div>
      <div class="admin-table-container">
        <div class="skeleton" style="height: 350px;"></div>
      </div>
    `;
  }

  /* ── RENDER COMPLETO ─────────────────────────────────────── */
  function render() {
    if (!element) return;

    const showingStart = totalProducts === 0 ? 0 : (currentPage - 1) * limit + 1;
    const showingEnd = Math.min(currentPage * limit, totalProducts);

    element.innerHTML = `
      <!-- Cabeçalho Administrativo -->
      <div class="admin-header-row">
        <div>
          <h1 class="font-primary font-black" style="font-size: var(--text-2xl); color: var(--color-text-primary);">
            Gerenciar Cardápio
          </h1>
          <div class="admin-nav-tabs">
            <a href="#admin-products" class="chip active">Produtos</a>
            <a href="#admin-categories" class="chip">Categorias</a>
            <a href="#admin-flavors" class="chip">Sabores</a>
          </div>
        </div>
        <button class="btn btn-primary" id="btn-new-product" type="button">
          ➕ Novo Produto
        </button>
      </div>

      <!-- Grid de Controles / Filtros -->
      <div class="admin-controls-grid">
        <div style="position: relative;">
          <input
            id="admin-search-input"
            class="input"
            type="search"
            placeholder="Buscar por nome ou descrição..."
            value="${searchVal}"
            style="border-radius: var(--radius-full); padding-left: var(--space-4);"
            aria-label="Buscar produtos"
          />
        </div>

        <div>
          <select id="admin-category-select" class="input" style="border-radius: var(--radius-full); cursor: pointer;" aria-label="Filtrar por Categoria">
            <option value="all">Todas as Categorias</option>
            ${categories.map(c => `<option value="${c.id}" ${c.id === categoryFilter ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>

        <div>
          <select id="admin-status-select" class="input" style="border-radius: var(--radius-full); cursor: pointer;" aria-label="Filtrar por Status">
            <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Todos os Status</option>
            <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Apenas Ativos</option>
            <option value="inactive" ${statusFilter === 'inactive' ? 'selected' : ''}>Apenas Inativos</option>
          </select>
        </div>
      </div>

      <!-- Tabela Administrativa -->
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Tamanhos e Preços</th>
              <th>Status</th>
              <th style="text-align: center; width: 140px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${products.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; padding: var(--space-8); color: var(--color-text-muted);">
                  Nenhum produto localizado com os filtros selecionados.
                </td>
              </tr>
            ` : products.map(prod => renderProductRow(prod)).join('')}
          </tbody>
        </table>
      </div>

      <!-- Linha de Paginação -->
      <div class="admin-pagination">
        <span class="text-muted text-xs">
          Exibindo ${showingStart}-${showingEnd} de ${totalProducts} produtos
        </span>
        
        <div class="flex gap-2">
          <button
            class="btn btn-secondary btn-sm"
            id="pag-prev"
            ${currentPage === 1 ? 'disabled' : ''}
            type="button"
            style="padding: var(--space-2) var(--space-4);"
          >
            ◀ Anterior
          </button>
          
          <span style="display: flex; align-items: center; padding: 0 var(--space-2); font-size: var(--text-xs); font-weight: var(--weight-bold);">
            Página ${currentPage} de ${totalPages}
          </span>

          <button
            class="btn btn-secondary btn-sm"
            id="pag-next"
            ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}
            type="button"
            style="padding: var(--space-2) var(--space-4);"
          >
            Próximo ▶
          </button>
        </div>
      </div>
    `;
  }

  /* ── RENDER ROW DO PRODUTO ───────────────────────────────── */
  function renderProductRow(product) {
    const activeBadge = product.active
      ? `<span class="badge badge-success">Ativo</span>`
      : `<span class="badge badge-surface" style="opacity: 0.6;">Inativo</span>`;

    const catObj = categories.find(c => c.id === product.category || c.id === product.categoryId);
    const categoryLabel = catObj ? catObj.label : 'Indefinida';

    const sizesHtml = product.sizes && product.sizes.length > 0
      ? product.sizes.map(s => `
          <div style="font-size: var(--text-2xs); margin-bottom: 2px;">
            <strong>${s.name}</strong>: <span class="text-brand font-semibold">${formatCurrency(s.price)}</span>
            ${s.maxFlavors > 1 ? `<span class="text-muted">(Max: ${s.maxFlavors} sab.)</span>` : ''}
          </div>
        `).join('')
      : '<span class="text-danger font-semibold" style="font-size: var(--text-xs);">Sem Tamanhos</span>';

    return `
      <tr id="row-${product.id}">
        <td>
          <div class="admin-prod-cell">
            <img class="admin-prod-img" src="${product.image || '/assets/pizza_hero.png'}" alt="${product.name}" onerror="this.src='/assets/pizza_hero.png';" />
            <div>
              <p class="admin-prod-title">${product.name}</p>
              <p class="admin-prod-desc" title="${product.description || ''}">${product.description || 'Sem descrição'}</p>
            </div>
          </div>
        </td>
        <td>
          <span class="text-sm font-medium" style="color: var(--color-text-secondary);">${categoryLabel}</span>
        </td>
        <td>
          <span class="badge-type ${product.type?.toLowerCase() || 'pizza'}">${product.type || 'PIZZA'}</span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            ${sizesHtml}
          </div>
        </td>
        <td>
          ${activeBadge}
        </td>
        <td>
          <div class="flex gap-2 justify-center">
            ${product.type === 'PIZZA' ? `
              <a
                class="btn btn-outline-secondary btn-sm"
                href="#admin-product-builder?id=${product.id}"
                style="padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-2xs); text-decoration: none; display: inline-flex; align-items: center; justify-content: center;"
              >
                ⚙️ Builder
              </a>
            ` : ''}
            <button
              class="btn btn-outline-primary btn-sm btn-edit"
              data-id="${product.id}"
              type="button"
              style="padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-2xs);"
            >
              📝 Editar
            </button>
            <button
              class="btn btn-ghost btn-sm btn-delete"
              data-id="${product.id}"
              data-name="${product.name}"
              type="button"
              style="padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-2xs); color: var(--color-primary);"
            >
              🗑️ Excluir
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /* ── EVENTOS DA PÁGINA PRINCIPAL ────────────────────────── */
  function setupEvents() {
    if (!element) return;

    // Novo Produto
    element.querySelector('#btn-new-product')?.addEventListener('click', () => {
      openProductFormModal();
    });

    // Pesquisa com Debounce simples
    const searchInput = element.querySelector('#admin-search-input');
    let debounceTimer = null;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchVal = e.target.value;
        currentPage = 1;
        loadData();
      }, 350);
    });

    // Filtros de Categoria e Status
    element.querySelector('#admin-category-select')?.addEventListener('change', (e) => {
      categoryFilter = e.target.value;
      currentPage = 1;
      loadData();
    });

    element.querySelector('#admin-status-select')?.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      currentPage = 1;
      loadData();
    });

    // Paginação
    element.querySelector('#pag-prev')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadData();
      }
    });

    element.querySelector('#pag-next')?.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadData();
      }
    });

    // Botões na tabela: Editar e Excluir
    element.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').dataset.id;
        const prod = products.find(p => p.id === id);
        if (prod) openProductFormModal(prod);
      });
    });

    element.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dataset = e.target.closest('[data-id]').dataset;
        confirmDeleteProduct(dataset.id, dataset.name);
      });
    });
  }

  /* ── DIÁLOGO DE EXCLUSÃO ────────────────────────────────── */
  function confirmDeleteProduct(id, name) {
    showConfirmDialog({
      title: '🗑️ Excluir Produto',
      message: `Tem certeza que deseja excluir o produto "${name}"? Essa ação é permanente e removerá todos os tamanhos dele.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteProduct(id);
          toastSuccess('Sucesso', `Produto "${name}" removido com sucesso.`);
          // Se a página ficar vazia ao remover, volta uma página
          if (products.length === 1 && currentPage > 1) {
            currentPage--;
          }
          loadData();
        } catch (err) {
          toastError('Erro', 'Não foi possível excluir o produto.');
        }
      }
    });
  }

  /* ── MODAL FORMULÁRIO (CADASTRO / EDIÇÃO) ───────────────── */
  function openProductFormModal(product = null) {
    const isEdit = !!product;
    let localSizes = product && product.sizes
      ? JSON.parse(JSON.stringify(product.sizes))
      : [];

    const dialogTitle = isEdit ? '📝 Editar Produto' : '🍕 Novo Produto';

    // HTML do formulário
    const bodyHtml = `
      <form id="product-form" style="display: flex; flex-direction: column; gap: var(--space-3);" onsubmit="return false;">
        <!-- Nome -->
        <div class="input-group">
          <label class="input-label" for="form-prod-name">Nome do Produto *</label>
          <input class="input" type="text" id="form-prod-name" required value="${product ? escapeHtml(product.name) : ''}" placeholder="Ex: Margherita Especial">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <!-- Categoria -->
          <div class="input-group">
            <label class="input-label" for="form-prod-category">Categoria *</label>
            <select class="input" id="form-prod-category" required style="cursor: pointer;">
              <option value="" disabled ${!product ? 'selected' : ''}>Selecione...</option>
              ${categories.map(c => `<option value="${c.id}" ${(product && (product.category === c.id || product.categoryId === c.id)) ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>

          <!-- Tipo -->
          <div class="input-group">
            <label class="input-label" for="form-prod-type">Tipo de Produto *</label>
            <select class="input" id="form-prod-type" required style="cursor: pointer;">
              <option value="PIZZA" ${(product && product.type === 'PIZZA') ? 'selected' : ''}>Pizza</option>
              <option value="DRINK" ${(product && product.type === 'DRINK') ? 'selected' : ''}>Bebida</option>
              <option value="DESSERT" ${(product && product.type === 'DESSERT') ? 'selected' : ''}>Sobremesa</option>
              <option value="SIDE" ${(product && product.type === 'SIDE') ? 'selected' : ''}>Acompanhamento</option>
              <option value="COMBO" ${(product && product.type === 'COMBO') ? 'selected' : ''}>Combo</option>
            </select>
          </div>
        </div>

        <!-- Descrição -->
        <div class="input-group">
          <label class="input-label" for="form-prod-desc">Descrição</label>
          <textarea class="input" id="form-prod-desc" rows="2" placeholder="Molho de tomate fresco, queijo, etc." style="resize: vertical; font-family: inherit;">${product && product.description ? escapeHtml(product.description) : ''}</textarea>
        </div>

        <!-- Imagem URL (Com sugestões locais baseadas no tipo de item) -->
        <div class="input-group">
          <label class="input-label" for="form-prod-image">URL da Imagem</label>
          <input class="input" type="text" id="form-prod-image" value="${product && product.image ? escapeHtml(product.image) : ''}" placeholder="URL da imagem ou sugestão abaixo">
          <div id="form-image-suggestions" style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;"></div>
        </div>

        <!-- Status Ativo -->
        <div style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-1); margin-bottom: var(--space-2);">
          <input type="checkbox" id="form-prod-active" ${(!product || product.active) ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
          <label for="form-prod-active" style="font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; user-select: none;">Produto Ativo / Disponível para Venda</label>
        </div>

        <!-- Sub CRUD de Tamanhos (ProductSize) -->
        <div class="input-group">
          <label class="input-label">📐 Configurar Tamanhos e Preços * (Mínimo 1)</label>
          
          <div class="sizes-crud-box">
            <!-- Listagem de tamanhos salvos localmente -->
            <div id="modal-sizes-list"></div>

            <!-- Formulário rápido para inserir novo tamanho -->
            <div class="size-form-add">
              <div>
                <input class="input" type="text" id="new-size-name" placeholder="Ex: Grande" style="padding: 8px 10px; font-size: var(--text-xs);">
              </div>
              <div>
                <input class="input" type="number" id="new-size-price" step="0.01" min="0.01" placeholder="R$ 0,00" style="padding: 8px 10px; font-size: var(--text-xs);">
              </div>
              <div>
                <input class="input" type="number" id="new-size-flavors" min="1" value="1" placeholder="Max Sabores" title="Max Sabores" style="padding: 8px 10px; font-size: var(--text-xs);">
              </div>
              <div>
                <input class="input" type="number" id="new-size-order" min="0" value="0" placeholder="Ordem" title="Ordem" style="padding: 8px 10px; font-size: var(--text-xs);">
              </div>
              <div>
                <button class="btn btn-outline-primary btn-sm" id="btn-add-size-row" type="button" style="padding: 8px var(--space-3); border-radius: var(--radius-md); font-size: var(--text-2xs);">
                  ➕ Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    `;

    // Ações do rodapé do modal
    const actions = [
      {
        text: 'Cancelar',
        type: 'ghost',
        handler: () => {}
      },
      {
        text: isEdit ? 'Salvar Alterações' : 'Cadastrar Produto',
        type: 'primary',
        handler: () => {} // Tratado manualmente no evento interceptado
      }
    ];

    // Exibe o diálogo
    showDialog({
      title: dialogTitle,
      body: bodyHtml,
      actions: actions,
      closable: true
    });

    // Injeta manipuladores extras no modal aberto
    const modalEl = document.getElementById('dialog-container');
    if (!modalEl) return;

    const form = modalEl.querySelector('#product-form');
    const imageInput = modalEl.querySelector('#form-prod-image');
    const typeSelect = modalEl.querySelector('#form-prod-type');

    // 1. Popula sugestões de imagem locais baseadas no tipo de produto
    const renderImageSuggestions = (type) => {
      const containerSug = modalEl.querySelector('#form-image-suggestions');
      if (!containerSug) return;

      containerSug.innerHTML = '';
      
      let suggestions = [];
      if (type === 'PIZZA') {
        suggestions = [
          { label: 'Calabresa', value: '/images/pizza_calabresa.png' },
          { label: 'Margherita', value: '/images/pizza_margherita.png' },
          { label: '4 Queijos', value: '/images/pizza_quatro_queijos.png' },
          { label: 'Pepperoni', value: '/images/pizza_pepperoni.png' },
          { label: 'Hero Pizza', value: '/assets/pizza_hero.png' }
        ];
      } else if (type === 'DRINK') {
        suggestions = [
          { label: 'Bebida Padrão', value: '/assets/coca_cola.png' } // Usa imagem local da bebida
        ];
      }

      if (suggestions.length === 0) return;

      const label = document.createElement('span');
      label.textContent = 'Sugestões:';
      label.style.cssText = 'font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center;';
      containerSug.appendChild(label);

      suggestions.forEach(sug => {
        const link = document.createElement('button');
        link.type = 'button';
        link.textContent = sug.label;
        link.style.cssText = 'font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface-light); cursor: pointer;';
        link.addEventListener('click', () => {
          imageInput.value = sug.value;
        });
        containerSug.appendChild(link);
      });
    };

    // Renderiza as sugestões do tipo atual
    renderImageSuggestions(typeSelect.value);
    
    // Altera sugestões dinamicamente caso o usuário mude o tipo
    typeSelect.addEventListener('change', (e) => {
      renderImageSuggestions(e.target.value);
    });

    // 2. Renderiza a lista de tamanhos do sub-CRUD
    const renderLocalSizesList = () => {
      const listContainer = modalEl.querySelector('#modal-sizes-list');
      if (!listContainer) return;

      if (localSizes.length === 0) {
        listContainer.innerHTML = `
          <p style="text-align: center; font-size: var(--text-2xs); color: var(--color-primary); padding: var(--space-2) 0;">
            ⚠️ Nenhum tamanho adicionado ainda. Configure pelo menos um tamanho abaixo.
          </p>
        `;
        return;
      }

      listContainer.innerHTML = localSizes.map((size, idx) => `
        <div class="size-list-item">
          <span style="font-size: var(--text-xs); font-weight: var(--weight-bold);">${size.name}</span>
          <span style="font-size: var(--text-xs); color: var(--color-primary); font-weight: var(--weight-semibold);">${formatCurrency(size.price)}</span>
          <span style="font-size: var(--text-2xs); color: var(--color-text-muted);">Sabores: ${size.maxFlavors}</span>
          <span style="font-size: var(--text-2xs); color: var(--color-text-muted);">Ordem: ${size.order}</span>
          <button
            class="btn-icon btn-remove-size"
            data-index="${idx}"
            type="button"
            style="color: var(--color-primary); font-size: var(--text-base); padding: 0; min-width: auto; height: auto;"
            title="Excluir tamanho"
          >
            ×
          </button>
        </div>
      `).join('');

      // Evento para remover tamanho da lista local
      listContainer.querySelectorAll('.btn-remove-size').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index, 10);
          localSizes.splice(idx, 1);
          renderLocalSizesList();
        });
      });
    };

    renderLocalSizesList();

    // Evento de adicionar tamanho
    modalEl.querySelector('#btn-add-size-row')?.addEventListener('click', () => {
      const nameInput = modalEl.querySelector('#new-size-name');
      const priceInput = modalEl.querySelector('#new-size-price');
      const flavorsInput = modalEl.querySelector('#new-size-flavors');
      const orderInput = modalEl.querySelector('#new-size-order');

      const name = nameInput.value.trim();
      const price = parseFloat(priceInput.value);
      const maxFlavors = parseInt(flavorsInput.value, 10) || 1;
      const order = parseInt(orderInput.value, 10) || 0;

      if (!name) {
        toastError('Validação', 'Por favor, informe o nome do tamanho (ex: Brotinho).');
        nameInput.focus();
        return;
      }
      if (isNaN(price) || price <= 0) {
        toastError('Validação', 'Por favor, informe um preço de venda maior que zero.');
        priceInput.focus();
        return;
      }

      // Adiciona na lista local
      localSizes.push({
        name,
        price,
        maxFlavors,
        order
      });

      // Ordena por ordem de exibição
      localSizes.sort((a, b) => a.order - b.order);

      // Reseta campos do form rápido
      nameInput.value = '';
      priceInput.value = '';
      flavorsInput.value = '1';
      orderInput.value = '0';

      renderLocalSizesList();
    });

    // 3. Substitui o clique do botão "Salvar" padrão para executar validação no formulário e submeter
    const submitBtn = modalEl.querySelector('.dialog-footer button.btn-primary');
    submitBtn?.replaceWith(submitBtn.cloneNode(true)); // remove o listener padrão do Dialog.js
    
    modalEl.querySelector('.dialog-footer button.btn-primary')?.addEventListener('click', async () => {
      const name = modalEl.querySelector('#form-prod-name').value.trim();
      const categoryId = modalEl.querySelector('#form-prod-category').value;
      const type = modalEl.querySelector('#form-prod-type').value;
      const description = modalEl.querySelector('#form-prod-desc').value.trim();
      const image = modalEl.querySelector('#form-prod-image').value.trim();
      const active = modalEl.querySelector('#form-prod-active').checked;

      // Validações no frontend
      if (!name) {
        toastError('Validação', 'O nome do produto é obrigatório.');
        modalEl.querySelector('#form-prod-name').focus();
        return;
      }
      if (!categoryId) {
        toastError('Validação', 'Selecione uma categoria válida para o produto.');
        modalEl.querySelector('#form-prod-category').focus();
        return;
      }
      if (localSizes.length === 0) {
        toastError('Validação', 'O produto deve conter pelo menos 1 tamanho configurado.');
        modalEl.querySelector('#new-size-name').focus();
        return;
      }

      const productPayload = {
        name,
        categoryId,
        type,
        description: description || null,
        image: image || null,
        active,
        sizes: localSizes,
        companyId: 'c51b18d2-4322-4bb3-be9d-f5e6b72a912e' // Default tenant id para fins demonstrativos
      };

      try {
        if (isEdit) {
          await updateProduct(product.id, productPayload);
          toastSuccess('Sucesso', 'Produto e tamanhos atualizados com sucesso.');
        } else {
          await createProduct(productPayload);
          toastSuccess('Sucesso', 'Produto e tamanhos cadastrados com sucesso.');
          currentPage = 1; // Volta para primeira página no cadastro
        }

        closeCurrentDialog();
        loadData();
      } catch (err) {
        toastError('Erro', err.message || 'Erro ao persistir dados do produto.');
      }
    });
  }

  /* ── RENDER ERRO ─────────────────────────────────────────── */
  function renderError() {
    if (!element) return;
    element.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) 0;">
        <p style="font-size: 48px; margin-bottom: var(--space-4);">😔</p>
        <h3 style="font-family: var(--font-primary); font-size: var(--text-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-2);">
          Falha na comunicação
        </h3>
        <p class="text-muted text-sm">Não foi possível carregar as categorias ou produtos.</p>
        <button class="btn btn-primary mt-6" onclick="window.location.reload()" type="button">Tentar novamente</button>
      </div>
    `;
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
    element = null;
    products = [];
    categories = [];
  }

  return { mount, destroy };
}
