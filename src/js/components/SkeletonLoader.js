/**
 * PizzaFlow — Skeleton Loader Component
 * Placeholders animados para carregamento de conteúdo.
 */

/* ==========================================================================
   SKELETONS PRONTOS
   ========================================================================== */

/**
 * Skeleton para um Product Card (vertical)
 * @returns {string} HTML
 */
export function skeletonProductCard() {
  return `
    <div class="product-card" aria-hidden="true">
      <div class="skeleton skeleton-image" style="height: 160px; border-radius: var(--radius-xl) var(--radius-xl) 0 0;"></div>
      <div class="product-card-body">
        <div class="skeleton skeleton-text" style="width: 45%; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text-lg" style="width: 80%; margin-bottom: 4px;"></div>
        <div class="skeleton skeleton-text" style="width: 90%;"></div>
        <div class="skeleton skeleton-text" style="width: 70%; margin-top: 2px;"></div>
        <div class="flex row-between mt-4">
          <div class="skeleton skeleton-text-lg" style="width: 40%;"></div>
          <div class="skeleton skeleton-circle" style="width: 40px; height: 40px;"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera N skeletons de product card
 * @param {number} count
 * @returns {string} HTML
 */
export function skeletonProductGrid(count = 4) {
  return Array(count).fill(skeletonProductCard()).join('');
}

/**
 * Skeleton para banner slider
 * @returns {string} HTML
 */
export function skeletonBanner() {
  return `
    <div class="skeleton skeleton-banner" style="height: 180px; border-radius: var(--radius-xl);" aria-hidden="true"></div>
  `;
}

/**
 * Skeleton para categoria
 * @returns {string} HTML
 */
export function skeletonCategory() {
  return `
    <div class="skeleton" style="width: 72px; height: 90px; border-radius: var(--radius-xl); flex-shrink: 0;" aria-hidden="true"></div>
  `;
}

/**
 * Gera N skeletons de categoria
 * @param {number} count
 * @returns {string} HTML
 */
export function skeletonCategories(count = 6) {
  return `
    <div class="scroll-row" aria-hidden="true">
      ${Array(count).fill(skeletonCategory()).join('')}
    </div>
  `;
}

/**
 * Skeleton para product card horizontal (scroll row)
 * @returns {string} HTML
 */
export function skeletonProductCardH() {
  return `
    <div class="scroll-item-lg" aria-hidden="true">
      ${skeletonProductCard()}
    </div>
  `;
}

/**
 * Skeleton para seção completa (título + grid)
 * @param {number} cardCount
 * @returns {string} HTML
 */
export function skeletonSection(cardCount = 4) {
  return `
    <div class="page-section" aria-hidden="true">
      <!-- Section title skeleton -->
      <div class="section-header">
        <div class="skeleton skeleton-title" style="width: 50%;"></div>
        <div class="skeleton skeleton-text" style="width: 20%;"></div>
      </div>
      <!-- Cards grid skeleton -->
      <div class="grid-2">
        ${skeletonProductGrid(cardCount)}
      </div>
    </div>
  `;
}

/**
 * Skeleton para a Home completa
 * @returns {string} HTML
 */
export function skeletonHome() {
  return `
    <div class="page-body" aria-busy="true" aria-label="Carregando conteúdo...">
      ${skeletonBanner()}
      ${skeletonCategories(6)}
      ${skeletonSection(4)}
      ${skeletonSection(4)}
    </div>
  `;
}

/**
 * Skeleton para um item do carrinho
 * @returns {string} HTML
 */
export function skeletonCartItem() {
  return `
    <div class="cart-item" aria-hidden="true">
      <div class="skeleton skeleton-circle" style="width: 72px; height: 72px; border-radius: var(--radius-md);"></div>
      <div class="flex flex-col gap-2 flex-1">
        <div class="skeleton skeleton-text-lg" style="width: 70%;"></div>
        <div class="skeleton skeleton-text" style="width: 30%;"></div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="skeleton skeleton-text" style="width: 60px;"></div>
        <div class="skeleton" style="width: 100px; height: 36px; border-radius: var(--radius-full);"></div>
      </div>
    </div>
  `;
}

/**
 * Mostra skeleton em um container e retorna função para removê-lo
 * @param {HTMLElement} container
 * @param {string} skeletonHTML
 * @returns {Function} clearSkeleton
 */
export function showSkeleton(container, skeletonHTML) {
  container.innerHTML = skeletonHTML;
  return () => {
    container.innerHTML = '';
  };
}
