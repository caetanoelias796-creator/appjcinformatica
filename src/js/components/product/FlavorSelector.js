import { formatCurrency } from '@utils/formatters.js';
import { EventBus } from '@/core/EventBus.js';
import { PizzaRules } from '@/core/PizzaRules.js';

/**
 * Cria o seletor de sabores
 * @param {object} options
 * @param {object[]} options.allProducts - Lista completa de produtos
 * @param {Function} options.onAdd - Callback para adicionar sabor
 * @param {Function} options.onRemove - Callback para remover sabor
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function FlavorSelector({ allProducts, onAdd, onRemove }) {
  let element = null;
  let searchTerm = '';
  let cachedState = null;
  let unsubscribe = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('section');
    element.className = 'product-modal-section';
    element.id = 'product-modal-flavors-section';

    // Escuta evento para atualizar automaticamente
    unsubscribe = EventBus.subscribe('product:updated', ({ config }) => {
      update(config);
    });

    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;
    cachedState = state;

    const { product, size, flavors } = state;
    if (!product || !size) return;

    // 1. Determina limite de sabores com base no tamanho usando PizzaRules
    const maxFlavors = PizzaRules.maxFlavors(size);
    const currentFlavorsCount = flavors.length;

    // 2. Filtra os sabores opcionais elegíveis (doce com doce, salgada com salgada)
    const isSweet = product.category === 'sobremesas';
    const optionalFlavors = allProducts.filter(p => {
      const matchCat = isSweet 
        ? p.category === 'sobremesas' 
        : (p.category === 'pizza-classica' || p.category === 'pizza-especial');
      return matchCat && p.isAvailable;
    });

    // 3. Aplica busca
    const filteredFlavors = optionalFlavors.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 4. Renderiza a interface
    element.innerHTML = `
      <div class="product-modal-section-title-wrapper">
        <h3 class="product-modal-section-title">
          <span>🍕 Escolha os sabores</span>
        </h3>
        <span class="product-modal-section-badge ${currentFlavorsCount > 0 ? '' : 'required'}">
          ${currentFlavorsCount}/${maxFlavors} ${maxFlavors === 1 ? 'sabor' : 'sabores'}
        </span>
      </div>

      <!-- Barra de Busca interna para sabores -->
      ${maxFlavors > 1 ? `
        <div style="margin-bottom: var(--space-4); position: relative;">
          <input 
            type="text" 
            class="input" 
            id="flavor-search-input" 
            placeholder="Buscar sabor..." 
            value="${searchTerm}"
            style="padding-left: 36px; height: 38px; font-size: 13px; border-radius: 12px; background: var(--color-surface-light);"
          />
          <svg style="position: absolute; left: 12px; top: 11px; color: var(--color-text-secondary);" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      ` : ''}

      <div class="flavor-list-container" role="group" aria-label="Sabores da pizza">
        ${filteredFlavors.map(f => {
          const isSelected = flavors.some(selected => selected.id === f.id);
          const sizeObj = f.sizes?.find(s => s.id === size.id);
          const priceStr = sizeObj ? formatCurrency(sizeObj.price) : 'N/D';
          
          // Se atingiu o limite de sabores e este item NÃO está selecionado, ele fica bloqueado
          const isBlocked = !isSelected && !PizzaRules.canAddFlavor(size, currentFlavorsCount);

          return `
            <div 
              class="flavor-item ${isSelected ? 'selected' : ''} ${isBlocked ? 'disabled' : ''}" 
              data-flavor-id="${f.id}"
              style="${isBlocked ? 'opacity: 0.5; cursor: not-allowed;' : 'cursor: pointer;'}"
            >
              <div class="flavor-item-info">
                <div class="flavor-item-name">${f.name}</div>
                <div class="flavor-item-desc">${f.description}</div>
              </div>
              <div style="display: flex; align-items: center;">
                <span class="flavor-item-price-badge">${priceStr}</span>
                <div class="flavor-item-checkbox" aria-checked="${isSelected}" role="checkbox" tabindex="${isBlocked ? '-1' : '0'}">
                  ${isSelected ? `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    setupEvents(filteredFlavors, maxFlavors);
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents(filteredFlavors, maxFlavors) {
    // Evento de busca
    const searchInput = element.querySelector('#flavor-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      // Re-renderiza sem notificar a store para não dar lag
      update(cachedState);
      // Mantém o foco e cursor no final do input
      const input = element.querySelector('#flavor-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    // Eventos nos itens
    const items = element.querySelectorAll('.flavor-item:not(.disabled)');
    items.forEach(item => {
      const handleSelection = () => {
        const flavorId = item.dataset.flavorId;
        const flavor = filteredFlavors.find(f => f.id === flavorId);
        if (!flavor) return;

        const isSelected = cachedState.flavors.some(f => f.id === flavorId);

        if (isSelected) {
          // Só remove se tiver mais de um sabor selecionado
          if (cachedState.flavors.length > 1) {
            onRemove(flavorId);
          }
        } else {
          // Só adiciona se não atingiu o limite
          if (cachedState.flavors.length < maxFlavors) {
            onAdd(flavor);
          }
        }
      };

      item.addEventListener('click', handleSelection);
      item.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleSelection();
        }
      });
    });
  }

  return {
    build,
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}
