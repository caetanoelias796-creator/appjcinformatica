/**
 * PizzaFlow — Category Navigation Component
 * Scroll horizontal de categorias com estado ativo.
 */

import { store } from '@store/store.js';

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

/**
 * Cria o componente de navegação por categorias
 * @param {Category[]} categories
 * @param {Function} onSelect — callback(categoryId)
 * @returns {{ el: HTMLElement, destroy: Function, setActive: Function }}
 */
export function CategoryNav(categories, onSelect) {
  let element = null;
  let activeId = store.getState().selectedCategory;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('nav');
    element.className = 'category-nav';
    element.setAttribute('aria-label', 'Categorias de produtos');
    element.setAttribute('role', 'tablist');

    render();
    setupEvents();

    return element;
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render() {
    if (!element) return;

    element.innerHTML = categories.map(cat => `
      <button
        class="category-item ${cat.id === activeId ? 'active' : ''}"
        role="tab"
        aria-selected="${cat.id === activeId}"
        aria-label="${cat.label} — ${cat.count} itens"
        data-category-id="${cat.id}"
        type="button"
      >
        <span class="category-icon" aria-hidden="true">${cat.icon}</span>
        <span class="category-label">${cat.label}</span>
      </button>
    `).join('');

    // Scroll para o item ativo
    const activeEl = element.querySelector(`[data-category-id="${activeId}"]`);
    if (activeEl) {
      setTimeout(() => {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 100);
    }
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    if (!element) return;

    element.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category-id]');
      if (!btn) return;

      const categoryId = btn.dataset.categoryId;
      setActive(categoryId);
      onSelect?.(categoryId);

      // Pequena animação de clique
      btn.classList.add('anim-scale-spring');
      btn.addEventListener('animationend', () => {
        btn.classList.remove('anim-scale-spring');
      }, { once: true });
    });
  }

  /* ── SET ACTIVE ─────────────────────────────────────────── */
  /**
   * Define a categoria ativa visualmente
   * @param {string} categoryId
   */
  function setActive(categoryId) {
    activeId = categoryId;

    if (!element) return;

    element.querySelectorAll('.category-item').forEach(btn => {
      const isActive = btn.dataset.categoryId === categoryId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    // Scroll para o item ativo
    const activeEl = element.querySelector(`[data-category-id="${categoryId}"]`);
    activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    element = null;
  }

  return { build, destroy, setActive };
}
