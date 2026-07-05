/**
 * PizzaFlow — Product Detail Page v3
 * Com misturação de sabores de pizzas, seleção de bordas recheadas, montagem de açaí com adicionais, observações e bebidas para acompanhar.
 */

import { store }            from '@store/store.js';
import { navigate, back }   from '@router/router.js';
import { fetchProduct, fetchProducts, fetchBorders } from '@services/api.js';
import { formatCurrency }   from '@utils/formatters.js';
import { toastCart }        from '@components/Toast.js';
import { getCartQuantity }  from '@store/store.js';
import { ProductCard }      from '@components/ProductCard.js';

/* ==========================================================================
   CONSTANTES DE AÇAÍ
   ========================================================================== */
const ACAI_FREE_ADDITIONS = [
  "Chocoboll", "Leite condensado", "Paçoca", "Disket", "Negresco", 
  "Banana", "Morango", "Uva", "Abacaxi", "Pêssego", "Kiwi", 
  "Leite em pó", "Calda de morango", "Calda de chocolate", 
  "Chocolate branco", "Chocolate preto", "Chocolate meio amargo", 
  "Marshmallow", "Granola", "Granola caseira", "Calda de caramelo"
];

const ACAI_PAID_5 = [
  "MM's", "Ouro Branco", "Creme de Choco Preto", "Creme de Choco Branco", 
  "Nutella", "Pistache", "Kit Kat", "Creme de Kinder Bueno", 
  "Creme Leite Ninho", "Creme Capuccino", "Creme Coco Cremoso"
];

const ACAI_PAID_2_5 = [
  "Stikadinho", "Prestigio", "Doce de Leite"
];

/* ==========================================================================
   FACTORY
   ========================================================================== */

export default function ProductPage() {
  let element         = null;
  let product         = null;
  let selectedSize    = null;
  let quantity        = 1;
  let isFav           = false;
  let relatedProducts = [];
  
  // Estado para customização de Pizza e Bebidas
  let allProductsList = [];
  let bordersList     = {};
  let selectedFlavors = [];
  let selectedBorder  = null;

  // Estado para montagem de Açaí
  let selectedFreeAdditions = [];
  let selectedPaidAdditions = []; // Array de objetos { name, price }

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page';
    element.style.paddingBottom = 'calc(var(--bottom-nav-height) + 90px)';
    container.appendChild(element);

    element.innerHTML = renderSkeleton();

    try {
      const productId = store.getState().currentProductId;
      if (!productId) { navigate('#home', { replace: true }); return { destroy }; }

      const [fetchedProduct, allProducts, fetchedBorders] = await Promise.all([
        fetchProduct(productId),
        fetchProducts(),
        fetchBorders()
      ]);

      product = fetchedProduct;
      allProductsList = allProducts;
      bordersList = fetchedBorders || {};

      selectedSize = product.sizes?.[1] || product.sizes?.[0] || null;
      quantity = getCartQuantity(product.id) || 1;

      // Inicializa sabores e borda padrão para pizza
      selectedFlavors = [product.id];
      if (bordersList && bordersList['sem-borda']) {
        selectedBorder = { id: 'sem-borda', ...bordersList['sem-borda'] };
      } else if (bordersList) {
        const firstKey = Object.keys(bordersList)[0];
        if (firstKey) selectedBorder = { id: firstKey, ...bordersList[firstKey] };
      }

      // Inicializa adicionais para açaí
      selectedFreeAdditions = [];
      selectedPaidAdditions = [];

      relatedProducts = allProducts
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

      render();

    } catch (err) {
      console.error(err);
      element.innerHTML = renderError();
    }

    return { destroy };
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render() {
    if (!element || !product) return;

    const isPizza = product.category === 'pizza-classica' || product.category === 'pizza-especial' || product.category === 'sobremesas';
    const isAcai  = product.category === 'acais';

    // Determina limite de sabores com base no tamanho da pizza
    let maxFlavors = 1;
    if (isPizza && selectedSize) {
      if (selectedSize.id === 'media') maxFlavors = 2;
      else if (selectedSize.id === 'grande') maxFlavors = 3;
      else if (selectedSize.id === 'trem') maxFlavors = 4;
    }

    // Limites de adicionais de Açaí
    let maxFree = 3;
    if (isAcai) {
      if (product.id.includes('500')) maxFree = 4;
      else if (product.id.includes('700')) maxFree = 5;
    }

    // Corrige sabores de pizza se mudou para tamanho com limite menor
    if (selectedFlavors.length > maxFlavors) {
      selectedFlavors = selectedFlavors.slice(0, maxFlavors);
    }

    // Calcula preço base da pizza (maior valor entre sabores para aquele tamanho)
    let basePrice = product.price || 0;
    if (isPizza && selectedSize) {
      let maxPrice = 0;
      selectedFlavors.forEach(flavorId => {
        const flv = allProductsList.find(p => p.id === flavorId);
        if (flv && flv.sizes) {
          const sizeObj = flv.sizes.find(s => s.id === selectedSize.id);
          if (sizeObj && sizeObj.price > maxPrice) {
            maxPrice = sizeObj.price;
          }
        }
      });
      basePrice = maxPrice || selectedSize.price;
    } else if (selectedSize) {
      basePrice = selectedSize.price;
    }

    const borderPrice  = (isPizza && selectedBorder) ? parseFloat(selectedBorder.price) : 0;
    const acaiPaidPrice = isAcai ? selectedPaidAdditions.reduce((sum, a) => sum + a.price, 0) : 0;
    const finalPrice   = basePrice + borderPrice + acaiPaidPrice;

    // Filtra sabores opcionais de pizza
    let optionalFlavors = [];
    if (isPizza) {
      if (product.category === 'sobremesas') {
        optionalFlavors = allProductsList.filter(p => p.category === 'sobremesas');
      } else {
        optionalFlavors = allProductsList.filter(p => p.category === 'pizza-classica' || p.category === 'pizza-especial');
      }
    }

    // Filtra bordas compatíveis
    let availableBorders = [];
    if (isPizza && bordersList) {
      const isSweet = product.category === 'sobremesas';
      availableBorders = Object.entries(bordersList).map(([id, b]) => ({ id, ...b }))
        .filter(b => b.category === 'ambas' || (isSweet ? b.category === 'doces' : b.category === 'salgadas'));
    }

    // Filtra bebidas para o acompanhamento rápido
    const beverages = allProductsList.filter(p => p.category === 'bebidas' && p.isAvailable);

    element.innerHTML = `
      <!-- Hero image -->
      <div style="position:relative; width:100%; background:var(--color-surface-light); border-radius:0 0 var(--radius-2xl) var(--radius-2xl); overflow:hidden;">
        <img
          id="product-hero-img"
          src="${product.image}"
          alt="${product.name}"
          style="width:100%; height:280px; object-fit:cover; display:block;"
          loading="eager"
        />
        <!-- Dark gradient -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:100px;background:linear-gradient(transparent,var(--color-bg));pointer-events:none;"></div>

        <!-- Back -->
        <button
          class="btn-icon glass"
          id="product-back-btn"
          style="position:absolute; top:calc(var(--header-height) + 8px); left:16px;"
          aria-label="Voltar"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <!-- Share + Fav -->
        <div style="position:absolute; top:calc(var(--header-height) + 8px); right:16px; display:flex; gap:8px;">
          <button class="btn-icon glass" id="product-fav-btn" aria-label="${isFav ? 'Remover favorito' : 'Favoritar'}" type="button">
            <span style="font-size:18px;" aria-hidden="true">${isFav ? '❤️' : '🤍'}</span>
          </button>
          <button class="btn-icon glass" id="product-share-btn" aria-label="Compartilhar" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>

        <!-- Badges -->
        <div style="position:absolute; bottom:16px; left:16px; display:flex; gap:6px; flex-wrap:wrap;">
          ${product.isBestSeller ? `<span class="badge badge-secondary">🔥 Mais pedida</span>` : ''}
          ${product.isNew        ? `<span class="badge badge-success">✨ Novo</span>` : ''}
        </div>
      </div>

      <!-- Conteúdo -->
      <div style="padding: var(--space-4) var(--content-padding-x);">

        <!-- Título, categoria e rating -->
        <div class="mb-4">
          <span style="font-size:var(--text-2xs); font-weight:var(--weight-semibold); color:var(--color-primary); text-transform:uppercase; letter-spacing:.1em;">
            ${getCategoryLabel(product.category)}
          </span>
          <h1 class="font-primary font-black mt-1" style="font-size:var(--text-2xl); line-height:1.15; letter-spacing:-.02em;">
            ${product.name}
          </h1>

          <div class="flex flex-wrap items-center gap-3 mt-2">
            <div class="rating">
              <span aria-hidden="true">⭐</span>
              <span class="font-semibold">${product.rating.toFixed(1)}</span>
              <span class="rating-count">(${product.reviewCount})</span>
            </div>
            <span class="text-muted text-xs">•</span>
            <span class="text-muted text-xs">🕐 ${product.prepTime}</span>
            ${product.calories ? `<span class="text-muted text-xs">• 🔥 ${product.calories} kcal</span>` : ''}
          </div>
        </div>

        <!-- Descrição -->
        <p class="text-secondary mb-4" style="line-height:var(--leading-relaxed); font-size:var(--text-sm);">
          ${product.description}
        </p>

        <!-- Ingredientes -->
        ${product.ingredients?.length ? `
          <div class="mb-4">
            <h2 class="font-primary font-semibold text-sm mb-2">Ingredientes</h2>
            <div class="flex flex-wrap gap-2">
              ${product.ingredients.map(ing => `<span class="chip">${ing}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Seleção de tamanho (se aplicável, e se não for açaí para evitar duplicar seleção de tamanho já que são produtos separados por volumetria) -->
        ${(product.sizes?.length && !isAcai) ? `
          <div class="mb-4">
            <h2 class="font-primary font-semibold text-sm mb-3">Tamanho</h2>
            <div id="size-selector" class="flex gap-2" role="group" aria-label="Selecione o tamanho">
              ${product.sizes.map(size => `
                <button
                  class="flex-1 card p-3 text-center press-effect"
                  data-size-id="${size.id}"
                  aria-pressed="${selectedSize?.id === size.id}"
                  type="button"
                  style="
                    border-radius:var(--radius-lg); cursor:pointer;
                    ${selectedSize?.id === size.id ? 'border-color:var(--color-primary);background:var(--color-primary-alpha-10);' : ''}
                  "
                >
                  <p class="font-primary font-bold text-xs ${selectedSize?.id === size.id ? 'text-brand' : ''}">${size.label}</p>
                  <p class="text-muted text-xs mt-1">${formatCurrency(size.price)}</p>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Montagem de Açaí -->
        ${isAcai ? `
          <div class="mb-5" style="border: 1px solid rgba(142,36,170,0.15); border-radius: var(--radius-xl); padding: var(--space-4); background: rgba(142,36,170,0.02);">
            <h2 class="font-primary font-black text-sm mb-1" style="color: #6a1b9a; display: flex; align-items: center; gap: 6px;">
              🟣 Customizar Açaí
            </h2>
            <p class="text-muted text-xs mb-4" id="acai-free-limit-text">Selecione até <strong>${maxFree} adicionais grátis</strong> inclusos no copo.</p>
            
            <!-- Adicionais Grátis -->
            <div class="mb-4">
              <h3 class="font-primary font-semibold text-xs mb-2">Adicionais Grátis (Max: ${maxFree})</h3>
              <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--color-surface-light); border-radius: var(--radius-lg); padding: var(--space-2); background: var(--color-surface);">
                ${ACAI_FREE_ADDITIONS.map(name => {
                  const isChecked = selectedFreeAdditions.includes(name);
                  return `
                    <label style="display:flex; align-items:center; justify-content:space-between; padding: 8px 12px; border-bottom: 1px solid var(--color-surface-light); cursor:pointer; user-select:none;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <input 
                          type="checkbox" 
                          data-acai-free-name="${name}" 
                          ${isChecked ? 'checked' : ''} 
                          style="accent-color:#6a1b9a; width: 16px; height: 16px; cursor:pointer;"
                        />
                        <span style="font-size:var(--text-xs); font-weight:var(--weight-medium);">${name}</span>
                      </div>
                      <span style="font-size:var(--text-2xs); color:var(--color-success); font-weight:bold;">Grátis</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Adicionais Pagos (+ R$ 2,50) -->
            <div class="mb-4">
              <h3 class="font-primary font-semibold text-xs mb-2">Adicionais Especiais (+ R$ 2,50)</h3>
              <div style="max-height: 140px; overflow-y: auto; border: 1px solid var(--color-surface-light); border-radius: var(--radius-lg); padding: var(--space-2); background: var(--color-surface);">
                ${ACAI_PAID_2_5.map(name => {
                  const isChecked = selectedPaidAdditions.some(a => a.name === name);
                  return `
                    <label style="display:flex; align-items:center; justify-content:space-between; padding: 8px 12px; border-bottom: 1px solid var(--color-surface-light); cursor:pointer; user-select:none;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <input 
                          type="checkbox" 
                          data-acai-paid-name="${name}" 
                          data-acai-paid-price="2.5"
                          ${isChecked ? 'checked' : ''} 
                          style="accent-color:#6a1b9a; width: 16px; height: 16px; cursor:pointer;"
                        />
                        <span style="font-size:var(--text-xs); font-weight:var(--weight-medium);">${name}</span>
                      </div>
                      <span style="font-size:var(--text-2xs); color:var(--color-text-muted); font-weight:bold;">+ R$ 2,50</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Adicionais Pagos (+ R$ 5,00) -->
            <div class="mb-4">
              <h3 class="font-primary font-semibold text-xs mb-2">Adicionais Premium (+ R$ 5,00)</h3>
              <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--color-surface-light); border-radius: var(--radius-lg); padding: var(--space-2); background: var(--color-surface);">
                ${ACAI_PAID_5.map(name => {
                  const isChecked = selectedPaidAdditions.some(a => a.name === name);
                  return `
                    <label style="display:flex; align-items:center; justify-content:space-between; padding: 8px 12px; border-bottom: 1px solid var(--color-surface-light); cursor:pointer; user-select:none;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <input 
                          type="checkbox" 
                          data-acai-paid-name="${name}" 
                          data-acai-paid-price="5"
                          ${isChecked ? 'checked' : ''} 
                          style="accent-color:#6a1b9a; width: 16px; height: 16px; cursor:pointer;"
                        />
                        <span style="font-size:var(--text-xs); font-weight:var(--weight-medium);">${name}</span>
                      </div>
                      <span style="font-size:var(--text-2xs); color:var(--color-text-muted); font-weight:bold;">+ R$ 5,00</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Resumo dos Adicionais -->
            <div class="mt-3">
              <h3 class="font-primary font-bold text-2xs mb-2" style="text-transform: uppercase; color: var(--color-text-muted);">Selecionados no Copo</h3>
              <div id="acai-selected-pills" style="display:flex; flex-wrap:wrap; gap:6px;">
                ${selectedFreeAdditions.map(name => `
                  <span class="chip" style="background:rgba(106,27,154,0.08); border:1px solid rgba(106,27,154,0.3); color:#6a1b9a; font-size:10px; padding:3px 8px; border-radius:20px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">
                    ${name}
                  </span>
                `).join('')}
                ${selectedPaidAdditions.map(a => `
                  <span class="chip" style="background:rgba(106,27,154,0.18); border:1px solid #6a1b9a; color:#4a148c; font-size:10px; padding:3px 8px; border-radius:20px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">
                    ${a.name} (+R$ ${a.price.toFixed(2)})
                  </span>
                `).join('')}
                ${selectedFreeAdditions.length === 0 && selectedPaidAdditions.length === 0 ? `
                  <p class="text-xs text-muted" style="font-style:italic;">Nenhum adicional selecionado ainda.</p>
                ` : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Mistura de Sabores e Bordas (Se for Pizza) -->
        ${isPizza ? `
          <!-- Sabores Selecionados -->
          <div class="mb-4">
            <h2 class="font-primary font-semibold text-sm mb-2">Sabores da Pizza</h2>
            <div class="flex flex-wrap gap-2 mb-3">
              ${selectedFlavors.map(fId => {
                const flv = allProductsList.find(p => p.id === fId);
                return `<span class="chip chip-primary" style="background:var(--color-primary-alpha-10); border:1px solid var(--color-primary); font-weight:bold;">${flv ? flv.name : fId}</span>`;
              }).join('')}
            </div>

            ${maxFlavors > 1 ? `
              <h3 class="font-primary text-xs text-muted mb-2">Adicionar outros sabores (Selecione até ${maxFlavors} sabores):</h3>
              <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--color-surface-light); border-radius: var(--radius-lg); padding: var(--space-2); background: var(--color-surface);">
                ${optionalFlavors.map(f => {
                  const isChecked = selectedFlavors.includes(f.id);
                  const sizePrice = f.sizes.find(s => s.id === selectedSize.id)?.price || 0;
                  return `
                    <label style="display:flex; align-items:center; justify-content:space-between; padding: 8px 12px; border-bottom: 1px solid var(--color-surface-light); cursor:pointer;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <input 
                          type="checkbox" 
                          data-flavor-id="${f.id}" 
                          ${isChecked ? 'checked' : ''} 
                          ${f.id === product.id ? 'disabled' : ''} 
                          style="accent-color:var(--color-primary); cursor:pointer;"
                        />
                        <span style="font-size:var(--text-xs); font-weight:var(--weight-medium);">${f.name}</span>
                      </div>
                      <span style="font-size:var(--text-2xs); color:var(--color-text-muted);">${formatCurrency(sizePrice)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            ` : `
              <p class="text-xs text-muted">Tamanho Brotinho permite apenas 1 sabor.</p>
            `}
          </div>

          <!-- Seleção de Bordas -->
          ${availableBorders.length > 0 ? `
            <div class="mb-4">
              <h2 class="font-primary font-semibold text-sm mb-3">Borda Recheada</h2>
              <div id="border-selector" class="flex flex-col gap-2" role="group" aria-label="Selecione a borda">
                ${availableBorders.map(b => `
                  <button
                    class="card p-3 flex justify-between items-center press-effect"
                    data-border-id="${b.id}"
                    aria-pressed="${selectedBorder?.id === b.id}"
                    type="button"
                    style="
                      border-radius:var(--radius-lg); cursor:pointer;
                      ${selectedBorder?.id === b.id ? 'border-color:var(--color-primary);background:var(--color-primary-alpha-10);' : ''}
                    "
                  >
                    <span class="font-primary font-bold text-xs ${selectedBorder?.id === b.id ? 'text-brand' : ''}">${b.name}</span>
                    <span class="text-muted text-xs">${b.price > 0 ? `+ ${formatCurrency(b.price)}` : 'Grátis'}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        ` : ''}

        <!-- Observações -->
        <div class="mb-5">
          <h2 class="font-primary font-semibold text-sm mb-2">Observações / Instruções Especiais</h2>
          <textarea 
            id="pizza-notes" 
            placeholder="Ex: Sem cebola, bem passada, sem amendoim, etc." 
            style="width:100%; height:60px; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--color-surface-light); background: var(--color-surface); color: var(--color-text); font-size: var(--text-xs); resize: none;"
          ></textarea>
        </div>

        <!-- Bebidas para acompanhar -->
        ${product.category !== 'bebidas' && beverages.length > 0 ? `
          <div class="mb-6">
            <h2 class="font-primary font-bold text-base mb-3">🥤 Bebidas bem geladas para acompanhar</h2>
            <div style="display:flex; flex-direction:column; gap:var(--space-2);">
              ${beverages.map(b => `
                <div class="card p-3 flex justify-between items-center" style="border-radius:var(--radius-lg); background:var(--color-surface);">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${b.image}" alt="${b.name}" style="width:40px; height:40px; object-fit:cover; border-radius:var(--radius-sm);" />
                    <div>
                      <p class="font-semibold text-xs">${b.name}</p>
                      <p class="text-brand font-bold text-xs mt-0.5">${formatCurrency(b.price)}</p>
                    </div>
                  </div>
                  <button
                    class="btn btn-outline-primary btn-sm"
                    data-add-beverage-id="${b.id}"
                    type="button"
                    style="font-size:11px; padding:6px 12px;"
                  >
                    + Adicionar
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Quantidade -->
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-primary font-semibold text-sm">Quantidade</h2>
          <div class="qty-control">
            <button class="qty-btn" id="qty-decrease" aria-label="Diminuir" type="button">−</button>
            <span class="qty-value" id="qty-display">${quantity}</span>
            <button class="qty-btn" id="qty-increase" aria-label="Aumentar" type="button">+</button>
          </div>
        </div>

        <!-- Botão Adicionar -->
        <button
          class="btn btn-primary btn-full btn-lg mb-6"
          id="product-add-btn"
          type="button"
        >
          🛒 Adicionar — ${formatCurrency(finalPrice * quantity)}
        </button>

        <!-- Produtos relacionados -->
        ${relatedProducts.length > 0 ? `
          <div class="mb-4">
            <h2 class="font-primary font-bold text-base mb-3">Você também pode gostar</h2>
            <div id="related-products-grid" class="grid-2"></div>
          </div>
        ` : ''}

        <div style="height:var(--space-8);"></div>
      </div>
    `;

    // Monta cards de relacionados
    if (relatedProducts.length > 0) {
      const grid = element.querySelector('#related-products-grid');
      if (grid) {
        relatedProducts.forEach(p => {
          const card = ProductCard(p, { layout: 'vertical' });
          grid.appendChild(card.build());
        });
      }
    }

    setupEvents();
  }

  /* ── EVENTS ──────────────────────────────────────────────── */
  function setupEvents() {
    if (!element) return;

    element.querySelector('#product-back-btn')?.addEventListener('click', back);

    // Favorito
    element.querySelector('#product-fav-btn')?.addEventListener('click', () => {
      isFav = !isFav;
      render();
    });

    // Compartilhar
    element.querySelector('#product-share-btn')?.addEventListener('click', async () => {
      if (navigator.share && product) {
        try {
          await navigator.share({
            title: product.name,
            text: product.description,
            url: `${window.location.origin}#product?id=${product.id}`,
          });
        } catch {}
      } else {
        navigator.clipboard?.writeText(`${window.location.origin}#product?id=${product.id}`);
        const { toastInfo } = await import('@components/Toast.js');
        toastInfo('Link copiado!', 'Cole e compartilhe onde quiser.');
      }
    });

    // Tamanho (Pizza)
    element.querySelector('#size-selector')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-size-id]');
      if (!btn) return;
      selectedSize = product.sizes.find(s => s.id === btn.dataset.sizeId);
      render();
    });

    // Sabores adicionais (Pizza Checkbox)
    element.querySelectorAll('input[data-flavor-id]').forEach(input => {
      input.addEventListener('change', () => {
        const flavorId = input.dataset.flavorId;
        const isChecked = input.checked;

        // Determina limite de sabores com base no tamanho
        let maxFlavors = 1;
        if (selectedSize) {
          if (selectedSize.id === 'media') maxFlavors = 2;
          else if (selectedSize.id === 'grande') maxFlavors = 3;
          else if (selectedSize.id === 'trem') maxFlavors = 4;
        }

        if (isChecked) {
          if (selectedFlavors.length >= maxFlavors) {
            input.checked = false;
            alert(`Para pizza de tamanho ${selectedSize.label.split(' ')[0]}, o limite é de no máximo ${maxFlavors} sabores.`);
            return;
          }
          selectedFlavors.push(flavorId);
        } else {
          const index = selectedFlavors.indexOf(flavorId);
          if (index > -1) {
            selectedFlavors.splice(index, 1);
          }
        }
        render();
      });
    });

    // Borda selector (Pizza)
    element.querySelector('#border-selector')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-border-id]');
      if (!btn) return;
      const borderId = btn.dataset.borderId;
      const borderData = bordersList[borderId];
      if (borderData) {
        selectedBorder = { id: borderId, ...borderData };
        render();
      }
    });

    // Adicionais Grátis (Açaí)
    element.querySelectorAll('input[data-acai-free-name]').forEach(input => {
      input.addEventListener('change', () => {
        const name = input.dataset.acaiFreeName;
        const isChecked = input.checked;

        let maxFree = 3;
        if (product.id.includes('500')) maxFree = 4;
        else if (product.id.includes('700')) maxFree = 5;

        if (isChecked) {
          if (selectedFreeAdditions.length >= maxFree) {
            input.checked = false;
            alert(`Limite de adicionais grátis atingido! Máximo de ${maxFree} para este tamanho.`);
            return;
          }
          selectedFreeAdditions.push(name);
        } else {
          const index = selectedFreeAdditions.indexOf(name);
          if (index > -1) selectedFreeAdditions.splice(index, 1);
        }
        render();
      });
    });

    // Adicionais Pagos (Açaí)
    element.querySelectorAll('input[data-acai-paid-name]').forEach(input => {
      input.addEventListener('change', () => {
        const name = input.dataset.acaiPaidName;
        const price = parseFloat(input.dataset.acaiPaidPrice);
        const isChecked = input.checked;

        if (isChecked) {
          selectedPaidAdditions.push({ name, price });
        } else {
          const index = selectedPaidAdditions.findIndex(a => a.name === name);
          if (index > -1) selectedPaidAdditions.splice(index, 1);
        }
        render();
      });
    });

    // Adicionar bebida rápido
    element.querySelectorAll('[data-add-beverage-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bevId = btn.dataset.addBeverageId;
        const bev = allProductsList.find(p => p.id === bevId);
        if (bev) {
          store.dispatch('ADD_TO_CART', {
            id:    bev.id,
            name:  bev.name,
            price: bev.price,
            image: bev.image,
          });
          toastCart(bev.name);
        }
      });
    });

    // Quantidade
    element.querySelector('#qty-decrease')?.addEventListener('click', () => {
      if (quantity > 1) { quantity--; updateQtyDisplay(); }
    });
    element.querySelector('#qty-increase')?.addEventListener('click', () => {
      quantity++;
      updateQtyDisplay();
    });

    // Adicionar ao carrinho
    element.querySelector('#product-add-btn')?.addEventListener('click', addToCart);
  }

  function updateQtyDisplay() {
    const display = element?.querySelector('#qty-display');
    if (display) display.textContent = quantity;

    const btn = element?.querySelector('#product-add-btn');
    if (btn && product) {
      const isPizza = product.category === 'pizza-classica' || product.category === 'pizza-especial' || product.category === 'sobremesas';
      const isAcai  = product.category === 'acais';
      
      let basePrice = product.price || 0;
      if (isPizza && selectedSize) {
        let maxPrice = 0;
        selectedFlavors.forEach(flavorId => {
          const flv = allProductsList.find(p => p.id === flavorId);
          if (flv && flv.sizes) {
            const sizeObj = flv.sizes.find(s => s.id === selectedSize.id);
            if (sizeObj && sizeObj.price > maxPrice) {
              maxPrice = sizeObj.price;
            }
          }
        });
        basePrice = maxPrice || selectedSize.price;
      } else if (selectedSize) {
        basePrice = selectedSize.price;
      }
      
      const borderPrice  = (isPizza && selectedBorder) ? parseFloat(selectedBorder.price) : 0;
      const acaiPaidPrice = isAcai ? selectedPaidAdditions.reduce((sum, a) => sum + a.price, 0) : 0;
      const finalPrice   = basePrice + borderPrice + acaiPaidPrice;
      
      btn.textContent = `🛒 Adicionar — ${formatCurrency(finalPrice * quantity)}`;
    }
  }

  function addToCart() {
    if (!product) return;

    const isPizza = product.category === 'pizza-classica' || product.category === 'pizza-especial' || product.category === 'sobremesas';
    const isAcai  = product.category === 'acais';

    let basePrice = product.price || 0;
    if (isPizza && selectedSize) {
      let maxPrice = 0;
      selectedFlavors.forEach(flavorId => {
        const flv = allProductsList.find(p => p.id === flavorId);
        if (flv && flv.sizes) {
          const sizeObj = flv.sizes.find(s => s.id === selectedSize.id);
          if (sizeObj && sizeObj.price > maxPrice) {
            maxPrice = sizeObj.price;
          }
        }
      });
      basePrice = maxPrice || selectedSize.price;
    } else if (selectedSize) {
      basePrice = selectedSize.price;
    }

    const borderPrice  = (isPizza && selectedBorder) ? parseFloat(selectedBorder.price) : 0;
    const acaiPaidPrice = isAcai ? selectedPaidAdditions.reduce((sum, a) => sum + a.price, 0) : 0;
    const finalPrice   = basePrice + borderPrice + acaiPaidPrice;

    // Constrói nome e identificadores do carrinho
    let cartItemName = product.name;
    let uniqueCartItemId = product.id;

    if (isPizza) {
      const flavorNames = selectedFlavors.map(fId => {
        return allProductsList.find(p => p.id === fId)?.name || fId;
      });
      cartItemName = flavorNames.length > 1
        ? `Pizza ${flavorNames.join(' + ')}`
        : product.name;
      uniqueCartItemId = `${product.id}-${selectedSize.id}-${selectedFlavors.sort().join('_')}-${selectedBorder ? selectedBorder.id : 'sem-borda'}`;
    } else if (isAcai) {
      // Para Açaí, cada combinação de adicionais grátis e pagos gera um item único no carrinho
      const freeAddString = selectedFreeAdditions.sort().join('_');
      const paidAddString = selectedPaidAdditions.map(a => a.name).sort().join('_');
      uniqueCartItemId = `${product.id}-${freeAddString}-${paidAddString}`;
    }

    const notesInput = element?.querySelector('#pizza-notes');
    const notes = notesInput ? notesInput.value.trim() : '';

    for (let i = 0; i < quantity; i++) {
      store.dispatch('ADD_TO_CART', {
        id:            uniqueCartItemId,
        productId:     product.id,
        name:          cartItemName,
        price:         finalPrice,
        image:         product.image,
        size:          selectedSize,
        border:        selectedBorder,
        flavors:       selectedFlavors,
        freeAdditions: isAcai ? [...selectedFreeAdditions] : undefined,
        paidAdditions: isAcai ? [...selectedPaidAdditions] : undefined,
        notes:         notes,
        category:      product.category
      });
    }

    toastCart(cartItemName);
    navigate('#cart');
  }

  /* ── SKELETON ─────────────────────────────────────────────── */
  function renderSkeleton() {
    return `
      <div aria-busy="true">
        <div class="skeleton" style="height:280px; border-radius:0 0 var(--radius-2xl) var(--radius-2xl);"></div>
        <div style="padding:var(--space-4) var(--content-padding-x);">
          <div class="skeleton skeleton-text mb-2" style="width:30%;"></div>
          <div class="skeleton skeleton-title mb-2" style="width:80%;"></div>
          <div class="skeleton skeleton-text mb-4" style="width:50%;"></div>
          <div class="skeleton skeleton-text mb-2" style="width:100%;"></div>
          <div class="skeleton skeleton-text mb-2" style="width:100%;"></div>
          <div class="skeleton skeleton-text" style="width:70%;"></div>
        </div>
      </div>
    `;
  }

  function renderError() {
    return `
      <div class="cart-empty" style="min-height:60vh;">
        <div class="cart-empty-icon">😔</div>
        <h1 class="cart-empty-title">Produto não encontrado</h1>
        <p class="cart-empty-desc">Esse produto não está disponível no momento.</p>
        <button class="btn btn-primary mt-6" type="button" onclick="window.location.hash='#home'">Voltar ao cardápio</button>
      </div>
    `;
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  const CATEGORY_LABELS = {
    'pizza-classica': 'Pizza Clássica', 'pizza-especial': 'Pizza Especial',
    'bebidas': 'Bebida', 'sobremesas': 'Sobremesa', 'combos': 'Combo',
    'lanches': 'Lanche', 'acais': 'Açaí'
  };
  function getCategoryLabel(id) { return CATEGORY_LABELS[id] ?? id; }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() { element = null; product = null; }

  return { mount, destroy };
}
