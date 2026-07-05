/**
 * PizzaFlow — Home Page
 * Página principal com todas as seções: Banner, Categorias, Promoções,
 * Mais Vendidas, Recomendadas e Complete seu Pedido.
 */

import { BannerSlider }  from '@components/Banner.js';
import { CategoryNav }  from '@components/CategoryNav.js';
import { ProductCard }  from '@components/ProductCard.js';
import { skeletonHome, skeletonSection } from '@components/SkeletonLoader.js';
import { store }        from '@store/store.js';

import {
  fetchBanners,
  fetchCategories,
  fetchProducts,
  fetchPromotions,
} from '@services/api.js';

import {
  getProductsByIds,
  bestSellerIds,
  recommendedIds,
  upsellProductIds,
} from '@data/mockData.js';

import { formatCurrency } from '@utils/formatters.js';

/* ==========================================================================
   FACTORY DA PÁGINA
   ========================================================================== */

export default function HomePage() {
  let element = null;
  let bannerSlider = null;
  let categoryNav = null;
  let unsubscribeCategory = null;
  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = 'all';

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    element = document.createElement('div');
    element.className = 'page';

    // Mostra skeleton enquanto carrega
    element.innerHTML = skeletonHome();
    container.appendChild(element);

    // Carrega dados em paralelo
    try {
      const [banners, categories, products, promotions] = await Promise.all([
        fetchBanners(),
        fetchCategories(),
        fetchProducts(),
        fetchPromotions(),
      ]);

      allProducts = products;
      filteredProducts = products;

      // Renderiza a página completa
      renderPage(banners, categories, products, promotions);

    } catch (error) {
      console.error('[HomePage] Erro ao carregar dados:', error);
      element.innerHTML = renderError();
    }

    return { destroy };
  }

  /* ── RENDER PAGE ─────────────────────────────────────────── */
  function renderPage(banners, categories, products, promotions) {
    if (!element) return;

    element.innerHTML = '';

    // 1. Banner Slider
    renderBannerSection(banners);

    // 2. Categorias
    renderCategorySection(categories);

    // 3. Promoções
    renderPromotionsSection(promotions, products);

    // 4. Mais Vendidas
    renderBestSellersSection(products);

    // 5. Recomendadas
    renderRecommendedSection(products);

    // 6. Complete seu pedido (upsell)
    renderUpsellSection(products);
  }

  /* ── 1. BANNER ───────────────────────────────────────────── */
  function renderBannerSection(banners) {
    const section = createSection('', false);
    section.style.padding = `var(--space-4) var(--content-padding-x) 0`;

    bannerSlider = BannerSlider(banners);
    const sliderEl = bannerSlider.build();
    section.appendChild(sliderEl);

    element.appendChild(section);
  }

  /* ── 2. CATEGORIAS ───────────────────────────────────────── */
  function renderCategorySection(categories) {
    const section = createSection('');
    section.style.padding = `var(--space-5) 0 0`;

    // Título
    const header = createSectionHeader('Categorias');
    header.style.padding = `0 var(--content-padding-x)`;
    section.appendChild(header);

    // Nav
    const nav = document.createElement('div');
    nav.style.cssText = `padding-left: var(--content-padding-x); overflow: hidden;`;

    categoryNav = CategoryNav(categories, (categoryId) => {
      currentCategory = categoryId;
      store.dispatch('SET_CATEGORY', categoryId);
      filterAndRenderProducts();
    });

    const navEl = categoryNav.build();
    navEl.style.paddingRight = 'var(--content-padding-x)';
    nav.appendChild(navEl);
    section.appendChild(nav);

    element.appendChild(section);
  }

  /* ── 3. PROMOÇÕES ────────────────────────────────────────── */
  function renderPromotionsSection(promotions, products) {
    const section = createSection('');
    section.style.padding = `var(--space-6) var(--content-padding-x) 0`;

    section.appendChild(createSectionHeader('🔥 Promoções', 'Ver todas'));

    const grid = document.createElement('div');
    grid.className = 'grid-2';
    grid.style.gap = 'var(--space-3)';

    promotions.slice(0, 4).forEach(promo => {
      const card = renderPromoCard(promo);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    element.appendChild(section);
  }

  function renderPromoCard(promo) {
    const card = document.createElement('div');
    card.className = 'card rounded-xl overflow-hidden cursor-pointer press-effect';
    card.style.cssText = `
      background: ${promo.gradient};
      border: none;
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-height: 130px;
      justify-content: space-between;
    `;

    card.innerHTML = `
      <div>
        <div style="font-size: 32px; line-height: 1; margin-bottom: 6px;" aria-hidden="true">${promo.emoji}</div>
        <h3 style="font-family: var(--font-primary); font-size: var(--text-sm); font-weight: var(--weight-bold); color: white; line-height: 1.2;">${promo.title}</h3>
        <p style="font-size: var(--text-xs); color: rgba(255,255,255,0.8); margin-top: 4px;">${promo.description}</p>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        ${promo.discount ? `
          <span style="
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 3px 8px;
            border-radius: var(--radius-full);
            font-size: var(--text-2xs);
            font-weight: var(--weight-bold);
          ">-${promo.discount}%</span>
        ` : ''}
        ${promo.promoPrice ? `
          <span style="font-family: var(--font-primary); font-size: var(--text-base); font-weight: var(--weight-black); color: white;">${formatCurrency(promo.promoPrice)}</span>
        ` : ''}
      </div>
    `;

    return card;
  }

  /* ── 4. MAIS VENDIDAS ────────────────────────────────────── */
  function renderBestSellersSection(products) {
    const bestSellers = getProductsByIds(bestSellerIds)
      .map(id => products.find(p => p.id === id) || id)
      .filter(p => p?.id);

    if (!bestSellers.length) return;

    const section = createSection('');
    section.style.padding = `var(--space-6) 0 0`;

    const header = createSectionHeader('🔥 Mais Pedidas', 'Ver todas');
    header.style.padding = `0 var(--content-padding-x)`;
    section.appendChild(header);

    // Scroll horizontal
    const scrollWrapper = document.createElement('div');
    scrollWrapper.style.cssText = `padding-left: var(--content-padding-x); overflow: hidden;`;

    const scrollRow = document.createElement('div');
    scrollRow.className = 'scroll-row';
    scrollRow.style.paddingRight = 'var(--content-padding-x)';
    scrollRow.setAttribute('aria-label', 'Produtos mais pedidos');

    bestSellers.forEach(product => {
      const wrapper = document.createElement('div');
      wrapper.className = 'scroll-item-lg';
      const card = ProductCard(product, { layout: 'vertical' });
      wrapper.appendChild(card.build());
      scrollRow.appendChild(wrapper);
    });

    scrollWrapper.appendChild(scrollRow);
    section.appendChild(scrollWrapper);
    element.appendChild(section);
  }

  /* ── 5. RECOMENDADAS ─────────────────────────────────────── */
  function renderRecommendedSection(products) {
    const recommended = getProductsByIds(recommendedIds)
      .map(id => products.find(p => p.id === id) || id)
      .filter(p => p?.id);

    if (!recommended.length) return;

    const section = createSection('');
    section.style.padding = `var(--space-6) var(--content-padding-x) 0`;

    section.appendChild(createSectionHeader('⭐ Recomendadas para você', 'Ver mais'));

    const grid = document.createElement('div');
    grid.className = 'grid-2';

    recommended.forEach(product => {
      const card = ProductCard(product, { layout: 'vertical' });
      grid.appendChild(card.build());
    });

    section.appendChild(grid);
    element.appendChild(section);
  }

  /* ── 6. UPSELL ───────────────────────────────────────────── */
  function renderUpsellSection(products) {
    const upsell = getProductsByIds(upsellProductIds)
      .map(id => products.find(p => p.id === id) || id)
      .filter(p => p?.id);

    if (!upsell.length) return;

    const section = createSection('');
    section.style.padding = `var(--space-6) var(--content-padding-x) 0`;

    section.appendChild(createSectionHeader('🍹 Complete seu pedido'));

    upsell.forEach(product => {
      const card = ProductCard(product, { layout: 'horizontal' });
      const cardEl = card.build();
      cardEl.style.marginBottom = 'var(--space-2)';
      section.appendChild(cardEl);
    });

    // Spacer final (para o floating cart não cobrir último item)
    const spacer = document.createElement('div');
    spacer.style.height = 'var(--space-8)';
    section.appendChild(spacer);

    element.appendChild(section);
  }

  /* ── FILTER PRODUCTS ─────────────────────────────────────── */
  function filterAndRenderProducts() {
    // Re-render das seções com filtro aplicado
    // Por simplicidade, mostra produtos filtrados na seção de Mais Vendidas
    // Em produção, isso re-renderizaria todas as seções relevantes
    filteredProducts = currentCategory === 'all'
      ? allProducts
      : allProducts.filter(p => p.category === currentCategory);

    // Remove e re-renderiza a seção de mais vendidas e recomendadas
    const sections = element.querySelectorAll('.filtered-section');
    sections.forEach(s => s.remove());

    if (currentCategory !== 'all') {
      const filteredSection = createSection('');
      filteredSection.className = 'filtered-section';
      filteredSection.style.padding = `var(--space-6) var(--content-padding-x) 0`;

      const catLabel = filteredProducts[0]?.category || currentCategory;
      filteredSection.appendChild(createSectionHeader(
        `📂 ${getCategoryName(currentCategory)}`,
        `${filteredProducts.length} produtos`
      ));

      const grid = document.createElement('div');
      grid.className = 'grid-2';

      filteredProducts.slice(0, 6).forEach(product => {
        const card = ProductCard(product, { layout: 'vertical' });
        grid.appendChild(card.build());
      });

      filteredSection.appendChild(grid);

      // Insere após o category nav (3° elemento filho do element)
      const thirdChild = element.children[2];
      if (thirdChild) {
        element.insertBefore(filteredSection, thirdChild);
      } else {
        element.appendChild(filteredSection);
      }
    }
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  function createSection(label, addPadding = true) {
    const section = document.createElement('section');
    if (label) section.setAttribute('aria-label', label);
    if (addPadding) section.className = 'page-section';
    return section;
  }

  function createSectionHeader(title, linkText = '') {
    const header = document.createElement('div');
    header.className = 'section-header mb-4';
    header.innerHTML = `
      <h2 class="section-title">${title}</h2>
      ${linkText ? `<span class="section-link" role="button" tabindex="0">${linkText}</span>` : ''}
    `;
    return header;
  }

  function renderError() {
    return `
      <div class="cart-empty" style="min-height: 60vh;">
        <div class="cart-empty-icon">😔</div>
        <h2 class="cart-empty-title">Ops!</h2>
        <p class="cart-empty-desc">Não conseguimos carregar o cardápio. Verifique sua conexão e tente novamente.</p>
        <button class="btn btn-primary mt-6" onclick="window.location.reload()" type="button">
          Tentar novamente
        </button>
      </div>
    `;
  }

  const CATEGORY_NAMES = {
    'all':            'Todas',
    'pizza-classica': 'Pizzas Clássicas',
    'pizza-especial': 'Pizzas Especiais',
    'bebidas':        'Bebidas',
    'sobremesas':     'Sobremesas',
    'combos':         'Combos',
  };

  function getCategoryName(id) {
    return CATEGORY_NAMES[id] ?? id;
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    bannerSlider?.destroy();
    categoryNav?.destroy();
    unsubscribeCategory?.();
    element = null;
  }

  return { mount, destroy };
}
