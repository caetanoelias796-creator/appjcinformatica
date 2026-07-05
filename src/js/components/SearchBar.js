/**
 * PizzaFlow — Search Bar Component
 * Overlay de busca full-screen com resultados em tempo real.
 */

import { fetchSearchResults } from '@services/api.js';
import { navigateToProduct } from '@router/router.js';
import { store } from '@store/store.js';
import { debounce, getStorage, setStorage } from '@utils/helpers.js';
import { formatCurrency } from '@utils/formatters.js';

/* ==========================================================================
   CONFIGURAÇÃO
   ========================================================================== */

const MAX_RECENT = 5;
const SEARCH_DELAY = 300; // ms

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

/**
 * Monta o overlay de busca
 * @param {HTMLElement} container — #search-overlay
 */
export function mountSearchBar(container) {
  let isOpen = false;
  let lastQuery = '';

  // Injeta a estrutura do overlay
  container.innerHTML = renderSearchOverlay();

  const input   = container.querySelector('.search-overlay-input');
  const backBtn = container.querySelector('.search-overlay-back');
  const resultsContainer = container.querySelector('#search-results');

  /* ── OPEN / CLOSE ─────────────────────────────────────────── */
  function open() {
    if (isOpen) return;
    isOpen = true;
    container.classList.add('open');
    container.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => input?.focus(), 150);
    showRecentSearches();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    container.classList.remove('open');
    container.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (input) input.value = '';
    lastQuery = '';
  }

  /* ── SEARCH ─────────────────────────────────────────────── */
  const doSearch = debounce(async (query) => {
    if (!query.trim()) {
      showRecentSearches();
      return;
    }

    if (query === lastQuery) return;
    lastQuery = query;

    showLoadingState();

    try {
      const results = await fetchSearchResults(query);
      showResults(results, query);
    } catch {
      showError();
    }
  }, SEARCH_DELAY);

  /* ── EVENTS ─────────────────────────────────────────────── */
  input?.addEventListener('input', (e) => {
    doSearch(e.target.value);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  backBtn?.addEventListener('click', close);

  container.addEventListener('click', (e) => {
    // Clique em resultado de busca
    const resultItem = e.target.closest('[data-product-id]');
    if (resultItem) {
      const productId = resultItem.dataset.productId;
      const query = input?.value?.trim();

      // Salva busca recente
      if (query) saveRecentSearch(query);

      close();
      navigateToProduct(productId);
    }
  });

  /* ── RENDERS ─────────────────────────────────────────────── */
  function showRecentSearches() {
    const recents = getStorage('recent-searches', []);

    if (!recents.length) {
      resultsContainer.innerHTML = `
        <div class="text-center py-12">
          <p style="font-size: 40px; margin-bottom: 12px;">🔍</p>
          <p class="text-muted text-sm">Digite para buscar pizzas, bebidas e mais...</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div>
        <p class="search-section-title">Buscas recentes</p>
        ${recents.map(search => `
          <div class="search-recent-item" tabindex="0">
            <span style="color: var(--color-text-muted); font-size: 16px;" aria-hidden="true">🕐</span>
            <span style="flex: 1;">${escapeHtml(search)}</span>
            <span style="color: var(--color-text-muted); font-size: 12px;">↗</span>
          </div>
        `).join('')}
      </div>
    `;

    // Clique em busca recente → repopula o input
    resultsContainer.querySelectorAll('.search-recent-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        if (input) {
          input.value = recents[i];
          doSearch(recents[i]);
          input.focus();
        }
      });
    });
  }

  function showResults(results, query) {
    if (!results.length) {
      resultsContainer.innerHTML = `
        <div class="text-center py-12">
          <p style="font-size: 40px; margin-bottom: 12px;">🍕</p>
          <p class="text-primary font-semibold mb-2">Nenhum resultado para</p>
          <p class="text-muted text-sm">"${escapeHtml(query)}"</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div>
        <p class="search-section-title">${results.length} resultado${results.length !== 1 ? 's' : ''}</p>
        ${results.map(product => `
          <div
            class="search-result-item"
            data-product-id="${product.id}"
            tabindex="0"
            role="button"
            aria-label="Ver ${product.name}"
          >
            <img
              class="search-result-image"
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
              onerror="this.style.background='var(--color-surface-light)'; this.alt='';"
            />
            <div style="flex: 1; min-width: 0;">
              <p class="font-semibold text-sm truncate">${product.name}</p>
              <p class="text-muted text-xs line-clamp-1">${product.description}</p>
              <p class="text-brand font-bold text-sm mt-1">${formatCurrency(product.price)}</p>
            </div>
            <span style="color: var(--color-text-muted); font-size: 18px;" aria-hidden="true">›</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function showLoadingState() {
    resultsContainer.innerHTML = `
      <div class="flex col-center" style="padding: 48px 0; gap: 16px;">
        <div class="spinner spinner-lg"></div>
        <p class="text-muted text-sm">Buscando...</p>
      </div>
    `;
  }

  function showError() {
    resultsContainer.innerHTML = `
      <div class="text-center py-12">
        <p style="font-size: 40px; margin-bottom: 12px;">⚠️</p>
        <p class="text-muted text-sm">Erro ao buscar. Tente novamente.</p>
      </div>
    `;
  }

  /* ── RECENT SEARCHES ─────────────────────────────────────── */
  function saveRecentSearch(query) {
    const recents = getStorage('recent-searches', []);
    const updated = [query, ...recents.filter(r => r !== query)].slice(0, MAX_RECENT);
    setStorage('recent-searches', updated);
  }

  /* ── CLEANUP ─────────────────────────────────────────────── */
  return {
    open,
    close,
    destroy() {
      container.innerHTML = '';
    },
  };
}

/* ==========================================================================
   RENDER OVERLAY BASE
   ========================================================================== */

function renderSearchOverlay() {
  return `
    <div class="search-overlay-header">
      <button
        class="search-overlay-back"
        aria-label="Fechar busca"
        type="button"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
      </button>

      <input
        class="search-overlay-input"
        type="search"
        placeholder="Pizza, bebida, sobremesa..."
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="Buscar produtos"
        id="search-main-input"
      />

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </div>

    <div class="search-overlay-body">
      <div id="search-results" aria-live="polite" aria-label="Resultados da busca"></div>
    </div>
  `;
}

/* ==========================================================================
   UTILITÁRIO
   ========================================================================== */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
