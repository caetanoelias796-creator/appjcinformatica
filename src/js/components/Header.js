/**
 * PizzaFlow — Header v2
 * Clique no endereço abre AddressModal. Observa mudanças do usuário.
 */

import { store, onUserChange } from '@store/store.js';
import { throttle }            from '@utils/helpers.js';
import { truncateAddress }     from '@utils/formatters.js';
import { openAddressModal }    from '@components/AddressModal.js';

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

export function Header() {
  let element       = null;
  let scrollHandler = null;
  let unsubUser     = null;

  /* ── MOUNT ─────────────────────────────────────────────── */
  function mount(insertBefore) {
    element = document.createElement('header');
    element.className = 'app-header';
    element.id = 'app-header';
    element.innerHTML = renderHeader();

    insertBefore.parentNode?.insertBefore(element, insertBefore);
    setupEvents();

    // Observa mudanças no user para atualizar o endereço
    unsubUser = onUserChange((user) => {
      const el = element?.querySelector('#header-address-value');
      if (el) el.textContent = truncateAddress(user.address || 'Selecione um endereço', 28);
    });

    return { destroy };
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function renderHeader() {
    const { user }  = store.getState();
    const address   = truncateAddress(user.address || 'Selecione um endereço', 28);

    return `
      <div class="header-inner">

        <!-- Logo -->
        <a class="header-logo" href="#home" aria-label="PizzaFlow — Início" id="header-logo">
          <span class="header-logo-icon" aria-hidden="true">🍕</span>
          <span class="header-logo-text">PizzaFlow</span>
        </a>

        <!-- Endereço -->
        <button
          class="header-address"
          aria-label="Alterar endereço de entrega"
          id="header-address-btn"
          type="button"
        >
          <span class="header-address-label">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Entregar em
          </span>
          <span class="header-address-value" id="header-address-value">${address}</span>
        </button>

        <!-- Ações -->
        <div class="header-actions">
          <div class="header-time-badge" aria-label="Tempo estimado">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z"/>
            </svg>
            ${user.estimatedTime}
          </div>

          <button class="btn-icon" id="header-search-btn" aria-label="Abrir busca" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>

      </div>
    `;
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    if (!element) return;

    // Scroll → glassmorphism
    scrollHandler = throttle(() => {
      element.classList.toggle('scrolled', window.scrollY > 10);
    }, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Busca
    element.querySelector('#header-search-btn')?.addEventListener('click', openSearch);

    // Logo
    element.querySelector('#header-logo')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#home';
    });

    // Endereço → abre modal
    element.querySelector('#header-address-btn')?.addEventListener('click', openAddressModal);
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  function openSearch() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => overlay.querySelector('.search-overlay-input')?.focus(), 100);
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    unsubUser?.();
    element?.remove();
    element = null;
  }

  return { mount, destroy };
}
