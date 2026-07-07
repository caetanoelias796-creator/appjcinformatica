/**
 * PizzaFlow — Painel Administrativo: Product Builder
 * Permite configurar tamanhos, preços, máximo de sabores,
 * bordas e adicionais para um determinado produto (Pizza).
 */

import {
  fetchProduct,
  updateProduct,
  fetchBorders,
  fetchExtras
} from '@services/api.js';
import { navigate } from '@router/router.js';
import { toastSuccess, toastError } from '@components/Toast.js';

export default function AdminProductBuilderPage() {
  let element = null;
  let product = null;
  let productSizes = [];
  let allBorders = [];
  let allExtras = [];
  let productId = null;

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page admin-product-builder-page';
    element.style.paddingBottom = 'calc(var(--bottom-nav-height) + 40px)';

    injectStyles();
    container.appendChild(element);

    renderSkeleton();

    // Extrai o ID do produto da URL hash: #admin-product-builder?id=UUID
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const params = new URLSearchParams(hash.substring(queryIndex + 1));
      productId = params.get('id');
    }

    if (!productId) {
      toastError('Erro', 'Nenhum produto especificado para o builder.');
      navigate('#admin-products');
      return { destroy };
    }

    try {
      // Carrega produto, bordas e extras em paralelo
      const [fetchedProduct, fetchedBorders, fetchedExtras] = await Promise.all([
        fetchProduct(productId),
        fetchBorders(),
        fetchExtras()
      ]);

      product = fetchedProduct;
      
      // Mapeia as bordas de Record para Array
      allBorders = Object.entries(fetchedBorders).map(([id, b]) => ({
        id,
        name: b.name,
        price: b.price,
        category: b.category
      }));

      allExtras = fetchedExtras || [];

      // Inicializa os tamanhos locais clonados do produto
      productSizes = product.sizes ? product.sizes.map(s => ({
        id: s.id,
        name: s.name || s.label,
        price: parseFloat(s.price),
        maxFlavors: s.maxFlavors || 1,
        order: s.order || 0,
        active: s.active !== false,
        crustIds: s.crustIds || [],
        extraIds: s.extraIds || []
      })) : [];

      render();
      setupEvents();

    } catch (err) {
      console.error('[AdminProductBuilder] Erro ao carregar dados:', err);
      renderError();
    }

    return { destroy };
  }

  /* ── ESTILOS EM ESCOPO ──────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('admin-builder-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-builder-styles';
    style.textContent = `
      .admin-product-builder-page {
        padding: var(--space-5) var(--content-padding-x);
      }
      .builder-header {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-6);
      }
      @media (min-width: 768px) {
        .builder-header {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
      }
      
      /* Grid de Cards */
      .builder-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }
      @media (min-width: 768px) {
        .builder-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1200px) {
        .builder-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      /* Card Estilizado */
      .builder-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        position: relative;
        transition: transform var(--transition-fast), box-shadow var(--transition-fast);
      }
      .builder-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .builder-card-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .builder-section-title {
        font-family: var(--font-primary);
        font-weight: var(--weight-bold);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: var(--space-2);
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-2);
        max-height: 140px;
        overflow-y: auto;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        background: var(--color-surface-light);
      }

      .checkbox-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-xs);
        cursor: pointer;
        user-select: none;
      }
      .checkbox-item input {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }

      .builder-footer-row {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
        margin-top: var(--space-6);
      }
    `;
    document.head.appendChild(style);
  }

  /* ── RENDER SKELETON ────────────────────────────────────── */
  function renderSkeleton() {
    if (!element) return;
    element.innerHTML = `
      <div class="builder-header">
        <div>
          <div class="skeleton skeleton-title" style="width: 300px;"></div>
          <div class="skeleton skeleton-text mt-2" style="width: 200px;"></div>
        </div>
      </div>
      <div class="builder-grid">
        <div class="skeleton" style="height: 400px; border-radius: var(--radius-xl);"></div>
        <div class="skeleton" style="height: 400px; border-radius: var(--radius-xl);"></div>
      </div>
    `;
  }

  /* ── RENDER COMPLETO ─────────────────────────────────────── */
  function render() {
    if (!element || !product) return;

    element.innerHTML = `
      <!-- Cabeçalho do Builder -->
      <div class="builder-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a href="#admin-products" class="chip">◀ Voltar para Produtos</a>
          </div>
          <h1 class="font-primary font-black" style="font-size: var(--text-2xl); color: var(--color-text-primary);">
            Product Builder — Pizza
          </h1>
          <p class="text-muted text-xs">Configurando o produto: <strong style="color: var(--color-primary);">${product.name}</strong></p>
        </div>

        <div class="flex gap-2">
          <button class="btn btn-secondary" id="btn-add-size-card" type="button">
            ➕ Adicionar Tamanho
          </button>
          <button class="btn btn-primary" id="btn-save-builder" type="button">
            💾 Salvar Configurações
          </button>
        </div>
      </div>

      <!-- Grid de Cards de Tamanhos -->
      <div class="builder-grid" id="builder-sizes-container">
        ${productSizes.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); color: var(--color-text-muted);">
            <p style="font-size: 36px; margin-bottom: 8px;">📏</p>
            <p class="font-semibold text-sm">Nenhum tamanho configurado para esta pizza.</p>
            <p class="text-xs mt-1">Clique em "Adicionar Tamanho" para começar.</p>
          </div>
        ` : productSizes.map((size, index) => renderSizeCard(size, index)).join('')}
      </div>
    `;
  }

  /* ── CARD DO TAMANHO ─────────────────────────────────────── */
  function renderSizeCard(size, index) {
    const isSweet = product.categoryId === 'sobremesas' || product.category === 'sobremesas';
    const compatibleBorders = allBorders.filter(b => b.category === 'ambas' || (isSweet ? b.category === 'doces' : b.category === 'salgadas'));

    const borderCheckboxes = compatibleBorders.map(b => {
      const checked = size.crustIds.includes(b.id) ? 'checked' : '';
      return `
        <label class="checkbox-item">
          <input type="checkbox" class="crust-checkbox" data-size-index="${index}" data-crust-id="${b.id}" ${checked} />
          <span>${b.name} (+R$ ${parseFloat(b.price).toFixed(2)})</span>
        </label>
      `;
    }).join('');

    const extraCheckboxes = allExtras.map(e => {
      const checked = size.extraIds.includes(e.id) ? 'checked' : '';
      return `
        <label class="checkbox-item">
          <input type="checkbox" class="extra-checkbox" data-size-index="${index}" data-extra-id="${e.id}" ${checked} />
          <span>${e.name} (+R$ ${parseFloat(e.price).toFixed(2)})</span>
        </label>
      `;
    }).join('');

    return `
      <div class="builder-card" data-index="${index}">
        <!-- Cabeçalho do Card -->
        <div class="builder-card-title-row">
          <span style="font-size: var(--text-xs); color: var(--color-primary); font-weight: var(--weight-bold); text-transform: uppercase;">
            Tamanho #${index + 1}
          </span>
          <button class="btn btn-ghost btn-sm btn-remove-card" data-index="${index}" type="button" style="color: var(--color-primary); padding: var(--space-1) var(--space-2); font-size: var(--text-2xs);">
            🗑️ Excluir
          </button>
        </div>

        <!-- Input Nome do Tamanho -->
        <div class="input-group">
          <label class="input-label" for="size-name-${index}">Nome do Tamanho *</label>
          <input class="input size-name-input" type="text" id="size-name-${index}" data-index="${index}" value="${escapeHtml(size.name)}" placeholder="Ex: Média (25cm) ou Grande" style="padding: 10px 12px; font-size: var(--text-xs);" />
        </div>

        <!-- Inputs Numéricos em Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="input-group">
            <label class="input-label" for="size-price-${index}">Preço Base (R$) *</label>
            <input class="input size-price-input" type="number" id="size-price-${index}" step="0.01" min="0.01" data-index="${index}" value="${size.price || ''}" placeholder="0.00" style="padding: 10px 12px; font-size: var(--text-xs);" />
          </div>

          <div class="input-group">
            <label class="input-label" for="size-flavors-${index}">Máx. Sabores *</label>
            <input class="input size-flavors-input" type="number" id="size-flavors-${index}" min="1" max="4" data-index="${index}" value="${size.maxFlavors}" style="padding: 10px 12px; font-size: var(--text-xs);" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="input-group">
            <label class="input-label" for="size-order-${index}">Ordem Exibição</label>
            <input class="input size-order-input" type="number" id="size-order-${index}" min="0" data-index="${index}" value="${size.order}" style="padding: 10px 12px; font-size: var(--text-xs);" />
          </div>

          <div class="input-group" style="display: flex; align-items: center; justify-content: flex-start; height: 100%; padding-top: var(--space-5);">
            <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer; user-select: none; font-size: var(--text-xs); font-weight: var(--weight-medium);">
              <input type="checkbox" class="size-active-input" data-index="${index}" ${size.active ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;" />
              Ativo
            </label>
          </div>
        </div>

        <!-- Checkboxes de Bordas Disponíveis -->
        <div>
          <h4 class="builder-section-title">Bordas Disponíveis</h4>
          <div class="checkbox-grid">
            ${borderCheckboxes || '<span style="font-size: var(--text-2xs); color: var(--color-text-muted);">Nenhuma borda cadastrada</span>'}
          </div>
        </div>

        <!-- Checkboxes de Extras Disponíveis -->
        <div>
          <h4 class="builder-section-title">Extras Disponíveis</h4>
          <div class="checkbox-grid">
            ${extraCheckboxes || '<span style="font-size: var(--text-2xs); color: var(--color-text-muted);">Nenhum extra cadastrado</span>'}
          </div>
        </div>
      </div>
    `;
  }

  /* ── REGISTRO DE EVENTOS DA PÁGINA ──────────────────────── */
  function setupEvents() {
    if (!element) return;

    // Adicionar novo tamanho
    element.querySelector('#btn-add-size-card')?.addEventListener('click', () => {
      syncLocalStateFromInputs();
      productSizes.push({
        id: `size-new-${Date.now()}`,
        name: '',
        price: 0,
        maxFlavors: 1,
        order: productSizes.length,
        active: true,
        crustIds: [],
        extraIds: []
      });
      render();
      setupEvents();
    });

    // Excluir card de tamanho
    element.querySelectorAll('.btn-remove-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('[data-index]').dataset.index, 10);
        syncLocalStateFromInputs();
        productSizes.splice(index, 1);
        render();
        setupEvents();
      });
    });

    // Eventos nas checkboxes de borda
    element.querySelectorAll('.crust-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const sizeIndex = parseInt(e.target.dataset.sizeIndex, 10);
        const crustId = e.target.dataset.crustId;
        const checked = e.target.checked;

        if (checked) {
          if (!productSizes[sizeIndex].crustIds.includes(crustId)) {
            productSizes[sizeIndex].crustIds.push(crustId);
          }
        } else {
          productSizes[sizeIndex].crustIds = productSizes[sizeIndex].crustIds.filter(id => id !== crustId);
        }
      });
    });

    // Eventos nas checkboxes de extras
    element.querySelectorAll('.extra-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const sizeIndex = parseInt(e.target.dataset.sizeIndex, 10);
        const extraId = e.target.dataset.extraId;
        const checked = e.target.checked;

        if (checked) {
          if (!productSizes[sizeIndex].extraIds.includes(extraId)) {
            productSizes[sizeIndex].extraIds.push(extraId);
          }
        } else {
          productSizes[sizeIndex].extraIds = productSizes[sizeIndex].extraIds.filter(id => id !== extraId);
        }
      });
    });

    // Salvar configurações gerais do Builder
    element.querySelector('#btn-save-builder')?.addEventListener('click', async () => {
      syncLocalStateFromInputs();

      // Validação frontend rápida dos tamanhos locais
      if (productSizes.length === 0) {
        toastError('Validação', 'É necessário ter pelo menos um tamanho configurado.');
        return;
      }

      for (let i = 0; i < productSizes.length; i++) {
        const s = productSizes[i];
        if (!s.name.trim()) {
          toastError('Validação', `Tamanho #${i + 1}: O nome é obrigatório.`);
          element.querySelector(`#size-name-${i}`)?.focus();
          return;
        }
        if (isNaN(s.price) || s.price <= 0) {
          toastError('Validação', `Tamanho #${i + 1}: O preço deve ser maior que zero.`);
          element.querySelector(`#size-price-${i}`)?.focus();
          return;
        }
        if (isNaN(s.maxFlavors) || s.maxFlavors < 1 || s.maxFlavors > 4) {
          toastError('Validação', `Tamanho #${i + 1}: O máximo de sabores deve ser entre 1 e 4.`);
          element.querySelector(`#size-flavors-${i}`)?.focus();
          return;
        }
      }

      const payload = {
        ...product,
        sizes: productSizes.map(s => ({
          id: s.id.startsWith('size-new-') ? undefined : s.id, // Remove id mock novo para gerar no backend
          name: s.name.trim(),
          price: parseFloat(s.price),
          maxFlavors: parseInt(s.maxFlavors, 10),
          order: parseInt(s.order, 10) || 0,
          active: s.active,
          crustIds: s.crustIds,
          extraIds: s.extraIds
        }))
      };

      try {
        await updateProduct(product.id, payload);
        toastSuccess('Sucesso', 'Product Builder salvo com sucesso!');
        navigate('#admin-products');
      } catch (err) {
        toastError('Erro', err.message || 'Falha ao salvar as configurações.');
      }
    });
  }

  /* ── SINCRIZAR ESTADO LOCAL COM INPUTS ───────────────────── */
  function syncLocalStateFromInputs() {
    if (!element) return;

    element.querySelectorAll('.builder-card').forEach(card => {
      const index = parseInt(card.dataset.index, 10);
      if (!productSizes[index]) return;

      const name = card.querySelector('.size-name-input').value.trim();
      const price = parseFloat(card.querySelector('.size-price-input').value) || 0;
      const maxFlavors = parseInt(card.querySelector('.size-flavors-input').value, 10) || 1;
      const order = parseInt(card.querySelector('.size-order-input').value, 10) || 0;
      const active = card.querySelector('.size-active-input').checked;

      productSizes[index].name = name;
      productSizes[index].price = price;
      productSizes[index].maxFlavors = maxFlavors;
      productSizes[index].order = order;
      productSizes[index].active = active;
    });
  }

  /* ── RENDER ERRO ─────────────────────────────────────────── */
  function renderError() {
    if (!element) return;
    element.innerHTML = `
      <div style="text-align: center; padding: var(--space-12) 0;">
        <p style="font-size: 48px; margin-bottom: var(--space-4);">😔</p>
        <h3 style="font-family: var(--font-primary); font-size: var(--text-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-2);">
          Falha na comunicação ou dados inválidos
        </h3>
        <p class="text-muted text-sm">Não foi possível carregar os dados deste produto. Certifique-se de que o ID é válido.</p>
        <button class="btn btn-primary mt-6" onclick="window.location.hash='#admin-products'" type="button">Voltar para Produtos</button>
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
    product = null;
    productSizes = [];
    allBorders = [];
    allExtras = [];
  }

  return { mount, destroy };
}
