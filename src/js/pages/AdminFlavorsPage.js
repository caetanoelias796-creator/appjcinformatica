/**
 * PizzaFlow — Painel Administrativo de Sabores
 * Oferece controle completo de cadastro, edição, busca, ordenação,
 * paginação e exclusão de sabores de pizza com verificação de pedidos ativos.
 */

import {
  fetchAdminFlavors,
  createFlavor,
  updateFlavor,
  deleteFlavor
} from '@services/api.js';
import { showConfirmDialog, showDialog, closeCurrentDialog } from '@components/Dialog.js';
import { toastSuccess, toastError } from '@components/Toast.js';

export default function AdminFlavorsPage() {
  let element = null;
  let flavors = [];
  let totalFlavors = 0;
  let currentPage = 1;
  let limit = 8;
  let totalPages = 1;

  // Filtros/Ordenação correntes
  let searchVal = '';
  let activeFilter = 'all'; // all, active, inactive
  let currentSort = 'order'; // name, order, status, date
  let currentOrder = 'asc'; // asc, desc

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page admin-flavors-page';
    element.style.paddingBottom = 'calc(var(--bottom-nav-height) + 40px)';

    injectStyles();

    container.appendChild(element);

    renderSkeleton();

    try {
      await loadData();
    } catch (err) {
      console.error('[AdminFlavors] Erro ao inicializar:', err);
      renderError();
    }

    return { destroy };
  }

  /* ── CARREGAR DADOS DA API ─────────────────────────────── */
  async function loadData() {
    try {
      const activeParam = activeFilter === 'all'
        ? undefined
        : activeFilter === 'active';

      const filters = {
        page: currentPage,
        limit,
        search: searchVal,
        active: activeParam,
        sort: currentSort,
        order: currentOrder,
        companyId: 'c51b18d2-4322-4bb3-be9d-f5e6b72a912e' // Tenant ID padrão
      };

      const res = await fetchAdminFlavors(filters);
      flavors = res.items || [];
      totalFlavors = res.total || 0;
      totalPages = res.pages || 1;

      render();
      setupEvents();
    } catch (err) {
      toastError('Erro', 'Não foi possível carregar os sabores.');
    }
  }

  /* ── ESTILOS EM ESCOPO ──────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('admin-flavors-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-flavors-styles';
    style.textContent = `
      .admin-flavors-page {
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
      @media (min-width: 768px) {
        .admin-controls-grid {
          grid-template-columns: 2fr 1fr 1fr 1fr;
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
        min-width: 700px;
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

      .admin-flavor-cell {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .admin-flavor-icon {
        font-size: 24px;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg);
        background: var(--color-surface-light);
        border: 1px solid var(--color-border);
      }
      .admin-flavor-img {
        width: 44px;
        height: 44px;
        object-fit: cover;
        border-radius: var(--radius-lg);
        background: var(--color-surface-light);
        border: 1px solid var(--color-border);
      }
      .admin-flavor-title {
        font-family: var(--font-primary);
        font-weight: var(--weight-semibold);
        color: var(--color-text-primary);
        font-size: var(--text-sm);
      }

      /* Paginação */
      .admin-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-2) 0;
      }
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
        <div class="skeleton" style="height: 45px; border-radius: var(--radius-full);"></div>
      </div>
      <div class="admin-table-container">
        <div class="skeleton" style="height: 300px;"></div>
      </div>
    `;
  }

  /* ── RENDER COMPLETO ─────────────────────────────────────── */
  function render() {
    if (!element) return;

    const showingStart = totalFlavors === 0 ? 0 : (currentPage - 1) * limit + 1;
    const showingEnd = Math.min(currentPage * limit, totalFlavors);

    element.innerHTML = `
      <!-- Cabeçalho Administrativo -->
      <div class="admin-header-row">
        <div>
          <h1 class="font-primary font-black" style="font-size: var(--text-2xl); color: var(--color-text-primary);">
            Gerenciar Cardápio
          </h1>
          <div class="admin-nav-tabs">
            <a href="#admin-products" class="chip">Produtos</a>
            <a href="#admin-categories" class="chip">Categorias</a>
            <a href="#admin-flavors" class="chip active">Sabores</a>
          </div>
        </div>
        <button class="btn btn-primary" id="btn-new-flavor" type="button">
          ➕ Novo Sabor
        </button>
      </div>

      <!-- Grid de Filtros / Controles -->
      <div class="admin-controls-grid">
        <div>
          <input
            id="admin-search-input"
            class="input"
            type="search"
            placeholder="Buscar por nome..."
            value="${searchVal}"
            style="border-radius: var(--radius-full); padding-left: var(--space-4);"
            aria-label="Buscar sabores"
          />
        </div>

        <div>
          <select id="admin-status-select" class="input" style="border-radius: var(--radius-full); cursor: pointer;" aria-label="Filtrar por Status">
            <option value="all" ${activeFilter === 'all' ? 'selected' : ''}>Todos os Status</option>
            <option value="active" ${activeFilter === 'active' ? 'selected' : ''}>Apenas Ativos</option>
            <option value="inactive" ${activeFilter === 'inactive' ? 'selected' : ''}>Apenas Inativos</option>
          </select>
        </div>

        <div>
          <select id="admin-sort-select" class="input" style="border-radius: var(--radius-full); cursor: pointer;" aria-label="Ordenar por">
            <option value="order" ${currentSort === 'order' ? 'selected' : ''}>Ordem de Exibição</option>
            <option value="name" ${currentSort === 'name' ? 'selected' : ''}>Nome do Sabor</option>
            <option value="status" ${currentSort === 'status' ? 'selected' : ''}>Status Operacional</option>
            <option value="date" ${currentSort === 'date' ? 'selected' : ''}>Data de Criação</option>
          </select>
        </div>

        <div>
          <select id="admin-direction-select" class="input" style="border-radius: var(--radius-full); cursor: pointer;" aria-label="Ordem de direção">
            <option value="asc" ${currentOrder === 'asc' ? 'selected' : ''}>Crescente (A-Z / 0-9)</option>
            <option value="desc" ${currentOrder === 'desc' ? 'selected' : ''}>Decrescente (Z-A / 9-0)</option>
          </select>
        </div>
      </div>

      <!-- Tabela Administrativa (FlavorTable) -->
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Sabor</th>
              <th>Descrição</th>
              <th style="width: 120px; text-align: center;">Ordem</th>
              <th style="width: 120px; text-align: center;">Status</th>
              <th style="text-align: center; width: 160px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${flavors.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align: center; padding: var(--space-8); color: var(--color-text-muted);">
                  Nenhum sabor cadastrado ou localizado.
                </td>
              </tr>
            ` : flavors.map(flavor => renderFlavorRow(flavor)).join('')}
          </tbody>
        </table>
      </div>

      <!-- Linha de Paginação -->
      <div class="admin-pagination">
        <span class="text-muted text-xs">
          Exibindo ${showingStart}-${showingEnd} de ${totalFlavors} sabores
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

  /* ── RENDER ROW DO SABOR ─────────────────────────────────── */
  function renderFlavorRow(flavor) {
    const activeBadge = flavor.active !== false
      ? `<span class="badge badge-success">Ativo</span>`
      : `<span class="badge badge-surface" style="opacity: 0.6;">Inativo</span>`;

    // Se for URL ou começa com /, renderiza <img>, senão emoji/ícone como texto
    const isUrl = flavor.image && (flavor.image.startsWith('http') || flavor.image.startsWith('/'));
    const representation = isUrl
      ? `<img class="admin-flavor-img" src="${flavor.image}" alt="${flavor.name}" onerror="this.outerHTML='<span class=\"admin-flavor-icon\">🍕</span>';" />`
      : `<span class="admin-flavor-icon">${flavor.image || '🍕'}</span>`;

    return `
      <tr id="row-${flavor.id}">
        <td>
          <div class="admin-flavor-cell">
            ${representation}
            <span class="admin-flavor-title">${flavor.name}</span>
          </div>
        </td>
        <td>
          <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">${flavor.description || 'Sem descrição'}</span>
        </td>
        <td style="text-align: center; font-weight: var(--weight-semibold); font-size: var(--text-xs);">
          ${flavor.displayOrder ?? 0}
        </td>
        <td style="text-align: center;">
          ${activeBadge}
        </td>
        <td>
          <div class="flex gap-2 justify-center">
            <button
              class="btn btn-outline-primary btn-sm btn-edit"
              data-id="${flavor.id}"
              type="button"
              style="padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-2xs);"
            >
              📝 Editar
            </button>
            <button
              class="btn btn-ghost btn-sm btn-delete"
              data-id="${flavor.id}"
              data-name="${flavor.name}"
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

    // Novo Sabor
    element.querySelector('#btn-new-flavor')?.addEventListener('click', () => {
      openFlavorFormModal();
    });

    // Pesquisa Debounced
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

    // Filtro Status
    element.querySelector('#admin-status-select')?.addEventListener('change', (e) => {
      activeFilter = e.target.value;
      currentPage = 1;
      loadData();
    });

    // Ordenação e Direção
    element.querySelector('#admin-sort-select')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      loadData();
    });

    element.querySelector('#admin-direction-select')?.addEventListener('change', (e) => {
      currentOrder = e.target.value;
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

    // Ações na tabela
    element.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').dataset.id;
        const flavor = flavors.find(f => f.id === id);
        if (flavor) openFlavorFormModal(flavor);
      });
    });

    element.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dataset = e.target.closest('[data-id]').dataset;
        confirmDeleteFlavor(dataset.id, dataset.name);
      });
    });
  }

  /* ── DIÁLOGO DE EXCLUSÃO ────────────────────────────────── */
  function confirmDeleteFlavor(id, name) {
    showConfirmDialog({
      title: '🗑️ Excluir Sabor',
      message: `Tem certeza que deseja excluir o sabor "${name}"? Essa ação não poderá ser desfeita se ele não estiver em uso em pedidos ativos.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await deleteFlavor(id);
          toastSuccess('Sucesso', `Sabor "${name}" removido com sucesso.`);
          if (flavors.length === 1 && currentPage > 1) {
            currentPage--;
          }
          loadData();
        } catch (err) {
          toastError('Erro de Restrição', err.message || 'Não foi possível excluir o sabor.');
        }
      }
    });
  }

  /* ── MODAL FORMULÁRIO (CADASTRO / EDIÇÃO) ───────────────── */
  function openFlavorFormModal(flavor = null) {
    const isEdit = !!flavor;
    const dialogTitle = isEdit ? '📝 Editar Sabor' : '🍕 Novo Sabor';

    const bodyHtml = `
      <form id="flavor-form" style="display: flex; flex-direction: column; gap: var(--space-3);" onsubmit="return false;">
        <!-- Nome -->
        <div class="input-group">
          <label class="input-label" for="form-flavor-name">Nome do Sabor *</label>
          <input class="input" type="text" id="form-flavor-name" required value="${flavor ? escapeHtml(flavor.name) : ''}" placeholder="Ex: Calabresa Especial">
        </div>

        <!-- Descrição -->
        <div class="input-group">
          <label class="input-label" for="form-flavor-desc">Descrição</label>
          <textarea class="input" id="form-flavor-desc" rows="2" placeholder="Ex: Molho, mussarela, calabresa fatiada, rodelas de cebola roxa e orégano...">${flavor && flavor.description ? escapeHtml(flavor.description) : ''}</textarea>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-3);">
          <!-- Imagem/Ícone URL -->
          <div class="input-group">
            <label class="input-label" for="form-flavor-image">Imagem (Emoji ou URL)</label>
            <input class="input" type="text" id="form-flavor-image" value="${flavor ? escapeHtml(flavor.image || '') : ''}" placeholder="Ex: 🍕 ou URL da foto">
            <div id="form-image-suggestions" style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;"></div>
          </div>

          <!-- Ordem de Exibição -->
          <div class="input-group">
            <label class="input-label" for="form-flavor-order">Ordem de Exibição *</label>
            <input class="input" type="number" id="form-flavor-order" min="0" required value="${flavor ? (flavor.displayOrder ?? 0) : '0'}">
          </div>
        </div>

        <!-- Checkbox Ativo -->
        <div style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-1); margin-bottom: var(--space-2);">
          <input type="checkbox" id="form-flavor-active" ${(!flavor || flavor.active !== false) ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
          <label for="form-flavor-active" style="font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; user-select: none;">Sabor Ativo (Exibe no montador de pizzas)</label>
        </div>
      </form>
    `;

    const actions = [
      {
        text: 'Cancelar',
        type: 'ghost',
        handler: () => {}
      },
      {
        text: isEdit ? 'Salvar Alterações' : 'Cadastrar Sabor',
        type: 'primary',
        handler: () => {}
      }
    ];

    showDialog({
      title: dialogTitle,
      body: bodyHtml,
      actions: actions,
      closable: true
    });

    const modalEl = document.getElementById('dialog-container');
    if (!modalEl) return;

    const imageInput = modalEl.querySelector('#form-flavor-image');

    // Popula sugestões de imagem locais
    const renderImageSuggestions = () => {
      const containerSug = modalEl.querySelector('#form-image-suggestions');
      if (!containerSug || !imageInput) return;

      containerSug.innerHTML = '';
      
      const suggestions = [
        { label: '🍕 Pizza', value: '🍕' },
        { label: 'Calabresa', value: '/assets/pizza_calabresa.png' },
        { label: 'Margherita', value: '/assets/pizza_margherita.png' },
        { label: '4 Queijos', value: '/assets/pizza_quatro_queijos.png' },
        { label: 'Chocolate', value: '/assets/pizza_chocolate.png' },
        { label: 'Padrão', value: '/assets/pizza_hero.png' },
        { label: 'Gourmet Calabresa', value: '/assets/gourmet_calabresa.png' },
        { label: 'Gourmet Margherita', value: '/assets/gourmet_margherita.png' },
        { label: 'Gourmet 4 Queijos', value: '/assets/gourmet_quatro_queijos.png' }
      ];

      const label = document.createElement('span');
      label.textContent = 'Sugestões:';
      label.style.cssText = 'font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center;';
      containerSug.appendChild(label);

      suggestions.forEach(sug => {
        const link = document.createElement('button');
        link.type = 'button';
        link.textContent = sug.label;
        link.style.cssText = 'font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface-light); cursor: pointer; color: var(--color-text-primary); transition: all var(--transition-fast);';
        
        link.addEventListener('mouseenter', () => {
          link.style.background = 'var(--color-surface-hover)';
          link.style.borderColor = 'var(--color-primary)';
        });
        link.addEventListener('mouseleave', () => {
          link.style.background = 'var(--color-surface-light)';
          link.style.borderColor = 'var(--color-border)';
        });
        
        link.addEventListener('click', () => {
          imageInput.value = sug.value;
        });
        containerSug.appendChild(link);
      });
    };

    renderImageSuggestions();

    const submitBtn = modalEl.querySelector('.dialog-footer button.btn-primary');
    submitBtn?.replaceWith(submitBtn.cloneNode(true)); // Limpa listeners

    modalEl.querySelector('.dialog-footer button.btn-primary')?.addEventListener('click', async () => {
      const name = modalEl.querySelector('#form-flavor-name').value.trim();
      const description = modalEl.querySelector('#form-flavor-desc').value.trim();
      const image = modalEl.querySelector('#form-flavor-image').value.trim();
      const displayOrderRaw = modalEl.querySelector('#form-flavor-order').value;
      const displayOrder = parseInt(displayOrderRaw, 10);
      const active = modalEl.querySelector('#form-flavor-active').checked;

      // Validação frontend
      if (!name) {
        toastError('Validação', 'O nome do sabor é obrigatório.');
        modalEl.querySelector('#form-flavor-name').focus();
        return;
      }
      if (name.length < 3 || name.length > 60) {
        toastError('Validação', 'O nome do sabor deve ter entre 3 e 60 caracteres.');
        modalEl.querySelector('#form-flavor-name').focus();
        return;
      }
      if (displayOrderRaw === '' || isNaN(displayOrder) || displayOrder < 0) {
        toastError('Validação', 'A ordem de exibição é obrigatória e deve ser um número não negativo.');
        modalEl.querySelector('#form-flavor-order').focus();
        return;
      }

      const payload = {
        name,
        description: description || null,
        image: image || null,
        displayOrder,
        active,
        companyId: 'c51b18d2-4322-4bb3-be9d-f5e6b72a912e' // Tenant ID padrão
      };

      try {
        if (isEdit) {
          await updateFlavor(flavor.id, payload);
          toastSuccess('Sucesso', 'Sabor atualizado com sucesso.');
        } else {
          await createFlavor(payload);
          toastSuccess('Sucesso', 'Sabor cadastrado com sucesso.');
          currentPage = 1;
        }

        closeCurrentDialog();
        loadData();
      } catch (err) {
        toastError('Erro', err.message || 'Erro ao salvar sabor.');
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
        <p class="text-muted text-sm">Não foi possível carregar os sabores do servidor.</p>
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
    flavors = [];
  }

  return { mount, destroy };
}
