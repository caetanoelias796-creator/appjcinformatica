/**
 * PizzaFlow — Catalog Page
 * Catálogo completo com filtros, ordenação, busca e grid de produtos.
 */

import { ProductCard }     from '@components/ProductCard.js';
import { skeletonProductGrid } from '@components/SkeletonLoader.js';
import { store }           from '@store/store.js';
import { fetchProducts, fetchCategories } from '@services/api.js';
import { debounce }        from '@utils/helpers.js';
import { normalizeForSearch } from '@utils/formatters.js';

/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Mais populares' },
  { value: 'rating',     label: 'Melhor avaliados' },
  { value: 'price-asc',  label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'new',        label: 'Novidades' },
];

const PAGE_SIZE = 8;

/* ==========================================================================
   FACTORY
   ========================================================================== */

export default function CatalogPage() {
  let element       = null;
  let allProducts   = [];
  let categories    = [];
  let filtered      = [];
  let currentSort   = 'popular';
  let currentCat    = store.getState().selectedCategory;
  let searchQuery   = '';
  let page          = 1;
  let activeFilters = [];   // chips de filtros ativos

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page';
    element.style.paddingBottom = 'calc(var(--bottom-nav-height) + 80px)';
    container.appendChild(element);

    // Skeleton enquanto carrega
    element.innerHTML = renderShell();
    const gridEl = element.querySelector('#catalog-grid');
    if (gridEl) gridEl.innerHTML = skeletonProductGrid(6);

    try {
      [allProducts, categories] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      buildUI();
    } catch {
      element.innerHTML = renderError();
    }

    return { destroy };
  }

  /* ── BUILD UI ─────────────────────────────────────────── */
  function buildUI() {
    element.innerHTML = renderShell();
    setupSearchBar();
    renderCategoryTabs();
    renderSortDropdown();
    applyFiltersAndRender();
    setupEvents();
  }

  /* ── SHELL HTML ────────────────────────────────────────── */
  function renderShell() {
    return `
      <div style="position: sticky; top: var(--header-height); z-index: var(--z-sticky); background: var(--color-bg);">

        <!-- Search Bar -->
        <div id="catalog-search-bar" style="padding: var(--space-3) var(--content-padding-x) 0;"></div>

        <!-- Category Tabs -->
        <nav
          id="catalog-cat-tabs"
          class="category-nav"
          aria-label="Filtrar por categoria"
          style="margin-top: var(--space-2);"
        ></nav>

        <!-- Sort + Filter row -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--content-padding-x);
          border-bottom: 1px solid var(--color-border);
          gap: var(--space-2);
        ">
          <div id="catalog-result-count" class="text-muted" style="font-size: var(--text-xs); white-space: nowrap;"></div>
          <div id="catalog-sort-wrap"></div>
        </div>

        <!-- Active Filters Chips -->
        <div id="catalog-filter-chips" style="padding: 0 var(--content-padding-x); min-height: 0;"></div>
      </div>

      <!-- Product Grid -->
      <div style="padding: var(--space-4) var(--content-padding-x) 0;">
        <div id="catalog-grid" class="grid-2"></div>
        <div id="catalog-load-more" style="display:none; text-align:center; padding: var(--space-6) 0;">
          <button class="btn btn-ghost btn-sm" id="catalog-load-btn" type="button">
            Carregar mais
          </button>
        </div>
        <div id="catalog-empty" style="display:none;"></div>
      </div>
    `;
  }

  /* ── SEARCH BAR ─────────────────────────────────────────── */
  function setupSearchBar() {
    const container = element.querySelector('#catalog-search-bar');
    if (!container) return;

    container.innerHTML = `
      <div style="position: relative;">
        <svg
          style="position:absolute; left:14px; top:50%; transform:translateY(-50%); pointer-events:none;"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="catalog-search-input"
          class="input"
          type="search"
          placeholder="Buscar no cardápio..."
          autocomplete="off"
          style="padding-left: 42px; border-radius: var(--radius-full);"
          aria-label="Buscar produtos no catálogo"
        />
        <button
          id="catalog-search-clear"
          style="
            display: none;
            position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
            background: none; border: none; color: var(--color-text-muted);
            font-size: 18px; cursor: pointer; padding: 0;
          "
          aria-label="Limpar busca"
          type="button"
        >×</button>
      </div>
    `;

    const input   = container.querySelector('#catalog-search-input');
    const clearBtn = container.querySelector('#catalog-search-clear');

    const doSearch = debounce((val) => {
      searchQuery = val;
      page = 1;
      clearBtn.style.display = val ? 'block' : 'none';
      applyFiltersAndRender();
    }, 280);

    input?.addEventListener('input', (e) => doSearch(e.target.value));

    clearBtn?.addEventListener('click', () => {
      if (input) input.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      page = 1;
      applyFiltersAndRender();
      input?.focus();
    });
  }

  /* ── CATEGORY TABS ───────────────────────────────────────── */
  function renderCategoryTabs() {
    const nav = element.querySelector('#catalog-cat-tabs');
    if (!nav || !categories.length) return;

    nav.innerHTML = categories.map(cat => `
      <button
        class="category-item ${cat.id === currentCat ? 'active' : ''}"
        data-cat-id="${cat.id}"
        aria-selected="${cat.id === currentCat}"
        role="tab"
        type="button"
      >
        <span class="category-icon" aria-hidden="true">${cat.icon}</span>
        <span class="category-label">${cat.label}</span>
      </button>
    `).join('');

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat-id]');
      if (!btn) return;
      currentCat = btn.dataset.catId;
      store.dispatch('SET_CATEGORY', currentCat);
      page = 1;

      nav.querySelectorAll('.category-item').forEach(b => {
        const active = b.dataset.catId === currentCat;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });

      applyFiltersAndRender();
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  /* ── SORT DROPDOWN ───────────────────────────────────────── */
  function renderSortDropdown() {
    const wrap = element.querySelector('#catalog-sort-wrap');
    if (!wrap) return;

    wrap.innerHTML = `
      <select
        class="input"
        id="catalog-sort-select"
        aria-label="Ordenar produtos"
        style="
          padding: 6px 10px;
          font-size: var(--text-xs);
          border-radius: var(--radius-full);
          height: auto;
          cursor: pointer;
          min-width: 140px;
        "
      >
        ${SORT_OPTIONS.map(opt => `
          <option value="${opt.value}" ${opt.value === currentSort ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join('')}
      </select>
    `;

    wrap.querySelector('#catalog-sort-select')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      page = 1;
      applyFiltersAndRender();
    });
  }

  /* ── FILTROS + RENDER ─────────────────────────────────────── */
  function applyFiltersAndRender() {
    let result = [...allProducts];

    // Filtro de categoria
    if (currentCat !== 'all') {
      result = result.filter(p => p.category === currentCat);
    }

    // Busca
    if (searchQuery.trim()) {
      const q = normalizeForSearch(searchQuery);
      result = result.filter(p =>
        normalizeForSearch(p.name).includes(q) ||
        normalizeForSearch(p.description).includes(q) ||
        p.tags.some(t => normalizeForSearch(t).includes(q)) ||
        p.ingredients.some(i => normalizeForSearch(i).includes(q))
      );
    }

    // Ordenação
    result = sortProducts(result, currentSort);

    filtered = result;
    renderGrid();
    renderCountAndChips();
  }

  function sortProducts(products, sort) {
    switch (sort) {
      case 'rating':     return [...products].sort((a, b) => b.rating - a.rating);
      case 'price-asc':  return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...products].sort((a, b) => b.price - a.price);
      case 'new':        return [...products].filter(p => p.isNew).concat(products.filter(p => !p.isNew));
      default:           return [...products].sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }

  /* ── GRID ─────────────────────────────────────────────── */
  function renderGrid() {
    const gridEl   = element.querySelector('#catalog-grid');
    const loadMore = element.querySelector('#catalog-load-more');
    const emptyEl  = element.querySelector('#catalog-empty');
    if (!gridEl) return;

    if (filtered.length === 0) {
      gridEl.innerHTML = '';
      if (emptyEl)  { emptyEl.style.display = 'block'; emptyEl.innerHTML = renderEmpty(); }
      if (loadMore) loadMore.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    const pageItems = filtered.slice(0, page * PAGE_SIZE);

    gridEl.innerHTML = '';
    pageItems.forEach(product => {
      const card = ProductCard(product, { layout: 'vertical' });
      gridEl.appendChild(card.build());
    });

    // Botão "Carregar mais"
    if (loadMore) {
      const hasMore = filtered.length > page * PAGE_SIZE;
      loadMore.style.display = hasMore ? 'block' : 'none';
    }
  }

  /* ── COUNT + CHIPS ──────────────────────────────────────── */
  function renderCountAndChips() {
    // Contagem
    const countEl = element.querySelector('#catalog-result-count');
    if (countEl) {
      const showing = Math.min(filtered.length, page * PAGE_SIZE);
      countEl.textContent = filtered.length === 0
        ? 'Nenhum resultado'
        : `${showing} de ${filtered.length} produtos`;
    }

    // Chips de filtros ativos
    const chipsEl = element.querySelector('#catalog-filter-chips');
    if (!chipsEl) return;

    const chips = [];
    if (currentCat !== 'all') {
      const cat = categories.find(c => c.id === currentCat);
      if (cat) chips.push({ label: cat.label, action: 'clear-cat' });
    }
    if (searchQuery) {
      chips.push({ label: `"${searchQuery}"`, action: 'clear-search' });
    }

    if (chips.length === 0) {
      chipsEl.innerHTML = '';
      chipsEl.style.padding = '0';
      return;
    }

    chipsEl.style.padding = `var(--space-2) var(--content-padding-x)`;
    chipsEl.innerHTML = `
      <div class="flex gap-2 flex-wrap">
        ${chips.map(chip => `
          <span class="chip chip-active" data-chip-action="${chip.action}" style="cursor:pointer;">
            ${chip.label}
            <span style="margin-left:4px; opacity:0.7;" aria-hidden="true">×</span>
          </span>
        `).join('')}
        ${chips.length > 1 ? `
          <button class="chip" data-chip-action="clear-all" style="cursor:pointer; border-color:var(--color-primary); color:var(--color-primary);" type="button">
            Limpar filtros
          </button>
        ` : ''}
      </div>
    `;
  }

  /* ── EMPTY STATE ─────────────────────────────────────────── */
  function renderEmpty() {
    return `
      <div style="text-align:center; padding: var(--space-12) 0;">
        <p style="font-size: 48px; margin-bottom: var(--space-4);">🔍</p>
        <h3 style="font-family: var(--font-primary); font-size: var(--text-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-2);">
          Nenhum resultado
        </h3>
        <p class="text-muted text-sm">Tente mudar os filtros ou buscar por outra coisa.</p>
        <button class="btn btn-ghost btn-sm mt-4" id="catalog-clear-all-btn" type="button">
          Limpar filtros
        </button>
      </div>
    `;
  }

  /* ── ERROR ───────────────────────────────────────────────── */
  function renderError() {
    return `
      <div class="cart-empty" style="min-height:60vh;">
        <div class="cart-empty-icon">😔</div>
        <h2 class="cart-empty-title">Erro ao carregar</h2>
        <p class="cart-empty-desc">Verifique sua conexão e tente novamente.</p>
        <button class="btn btn-primary mt-6" onclick="window.location.reload()" type="button">Tentar novamente</button>
      </div>
    `;
  }

  /* ── EVENTS ──────────────────────────────────────────────── */
  function setupEvents() {
    // Load more
    element.addEventListener('click', (e) => {
      if (e.target.closest('#catalog-load-btn')) {
        page++;
        renderGrid();
        renderCountAndChips();
        return;
      }

      // Chips
      const chip = e.target.closest('[data-chip-action]');
      if (chip) {
        const action = chip.dataset.chipAction;
        if (action === 'clear-cat')    { currentCat = 'all'; store.dispatch('SET_CATEGORY', 'all'); }
        if (action === 'clear-search') { searchQuery = ''; const inp = element.querySelector('#catalog-search-input'); if (inp) inp.value = ''; }
        if (action === 'clear-all')    { currentCat = 'all'; searchQuery = ''; const inp = element.querySelector('#catalog-search-input'); if (inp) inp.value = ''; }
        page = 1;
        renderCategoryTabs();
        applyFiltersAndRender();
        return;
      }

      // Empty state clear button
      if (e.target.closest('#catalog-clear-all-btn')) {
        currentCat = 'all';
        searchQuery = '';
        page = 1;
        const inp = element.querySelector('#catalog-search-input');
        if (inp) inp.value = '';
        renderCategoryTabs();
        applyFiltersAndRender();
      }
    });
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    element = null;
    allProducts = [];
    filtered = [];
  }

  return { mount, destroy };
}
