/**
 * PizzaFlow — Banner Slider Component
 * Carrossel de banners com auto-play, swipe touch e dots de navegação.
 */

import { clamp } from '@utils/helpers.js';

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

/**
 * Cria um slider de banners
 * @param {Banner[]} banners
 * @returns {{ el: HTMLElement, destroy: Function }}
 */
export function BannerSlider(banners) {
  let currentIndex = 0;
  let autoPlayTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let element = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('div');
    element.className = 'banner-slider';
    element.setAttribute('aria-roledescription', 'carousel');
    element.setAttribute('aria-label', 'Promoções em destaque');

    element.innerHTML = `
      <!-- Track (slides container) -->
      <div class="banner-track" id="banner-track">
        ${banners.map((banner, i) => renderSlide(banner, i)).join('')}
      </div>

      <!-- Pagination dots -->
      <div class="banner-dots" role="tablist" aria-label="Slides do carrossel">
        ${banners.map((_, i) => `
          <button
            class="banner-dot ${i === 0 ? 'active' : ''}"
            role="tab"
            aria-selected="${i === 0}"
            aria-label="Ir para slide ${i + 1}"
            data-banner-dot="${i}"
            type="button"
          ></button>
        `).join('')}
      </div>
    `;

    setupEvents();
    startAutoPlay();

    return element;
  }

  /* ── RENDER SLIDE ─────────────────────────────────────────── */
  function renderSlide(banner, index) {
    return `
      <div
        class="banner-slide"
        role="tabpanel"
        aria-label="Slide ${index + 1} de ${banners.length}"
        aria-hidden="${index !== 0}"
        data-banner-index="${index}"
      >
        <!-- Background image com fallback de gradient -->
        <img
          class="banner-slide-image"
          src="${banner.image}"
          alt="${banner.imageAlt}"
          loading="${index === 0 ? 'eager' : 'lazy'}"
          onerror="this.style.display='none'"
        />

        <!-- Gradient fallback overlay (quando imagem falha ou como overlay) -->
        <div
          class="banner-slide-overlay"
          style="background: linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);"
        >
          <div class="banner-slide-content">
            <span class="banner-slide-tag">${banner.tag}</span>
            <h2 class="banner-slide-title">${banner.title.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</h2>
            <p class="banner-slide-subtitle">${banner.subtitle}</p>
            <button
              class="banner-slide-btn ripple-container"
              data-banner-action="${banner.buttonAction}"
              data-banner-target="${banner.buttonTarget}"
              aria-label="${banner.buttonText}"
              type="button"
            >
              ${banner.buttonText} ›
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ── NAVIGATION ─────────────────────────────────────────── */
  function goTo(index) {
    currentIndex = clamp(index, 0, banners.length - 1);
    updateSlider();
    resetAutoPlay();
  }

  function next() {
    currentIndex = (currentIndex + 1) % banners.length;
    updateSlider();
  }

  function prev() {
    currentIndex = (currentIndex - 1 + banners.length) % banners.length;
    updateSlider();
  }

  function updateSlider() {
    if (!element) return;

    // Move o track
    const track = element.querySelector('#banner-track');
    if (track) {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    // Atualiza dots
    element.querySelectorAll('.banner-dot').forEach((dot, i) => {
      const isActive = i === currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });

    // Atualiza slides (aria-hidden)
    element.querySelectorAll('.banner-slide').forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i !== currentIndex));
    });
  }

  /* ── AUTO PLAY ──────────────────────────────────────────── */
  function startAutoPlay() {
    autoPlayTimer = setInterval(next, 4500);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  /* ── EVENTS ─────────────────────────────────────────────── */
  function setupEvents() {
    if (!element) return;

    // Dots de paginação
    element.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-banner-dot]');
      if (dot) {
        goTo(parseInt(dot.dataset.bannerDot, 10));
        return;
      }

      const btn = e.target.closest('[data-banner-action]');
      if (btn) {
        handleBannerAction(btn.dataset.bannerAction, btn.dataset.bannerTarget);
      }
    });

    // Touch / Swipe
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove',  onTouchMove,  { passive: true });
    element.addEventListener('touchend',   onTouchEnd,   { passive: true });

    // Mouse drag (desktop)
    element.addEventListener('pointerdown', onPointerDown);

    // Pausa ao hover
    element.addEventListener('mouseenter', stopAutoPlay);
    element.addEventListener('mouseleave', startAutoPlay);
  }

  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = false;
  }

  function onTouchMove(e) {
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > dy) isDragging = true;
  }

  function onTouchEnd(e) {
    if (!isDragging) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      delta < 0 ? next() : prev();
    }
    isDragging = false;
  }

  function onPointerDown(e) {
    touchStartX = e.clientX;
    const onUp = (upEvent) => {
      const delta = upEvent.clientX - touchStartX;
      if (Math.abs(delta) > 50) {
        delta < 0 ? next() : prev();
      }
      element?.removeEventListener('pointerup', onUp);
    };
    element?.addEventListener('pointerup', onUp, { once: true });
  }

  /* ── ACTION HANDLER ─────────────────────────────────────── */
  function handleBannerAction(action, target) {
    if (action === 'navigate') {
      window.location.hash = target;
    } else if (action === 'product') {
      import('@store/store.js').then(({ store }) => {
        store.dispatch('SET_PRODUCT', target);
        window.location.hash = '#product';
      });
    }
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    stopAutoPlay();
    element = null;
  }

  return { build, destroy };
}
