/**
 * PizzaFlow — Helpers
 * Funções utilitárias reutilizáveis para toda a aplicação.
 */

/* ==========================================================================
   DOM HELPERS
   ========================================================================== */

/**
 * Seleciona um elemento do DOM (atalho para querySelector)
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element|null}
 */
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Seleciona todos os elementos correspondentes (atalho para querySelectorAll)
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {NodeListOf<Element>}
 */
export function qsa(selector, root = document) {
  return root.querySelectorAll(selector);
}

/**
 * Cria um elemento HTML com atributos e filhos opcionais
 * @param {string} tag
 * @param {Record<string, string>} [attrs={}]
 * @param {string|Element|(string|Element)[]} [children]
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children) {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'class') {
      el.className = val;
    } else if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = val;
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(el.style, val);
    } else {
      el.setAttribute(key, val);
    }
  });

  if (children !== undefined) {
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach(child => {
      if (typeof child === 'string') {
        el.insertAdjacentHTML('beforeend', child);
      } else if (child instanceof Element) {
        el.appendChild(child);
      }
    });
  }

  return el;
}

/**
 * Adiciona um ou mais event listeners com possibilidade de delegação
 * @param {Element|Window|Document} target
 * @param {string} event
 * @param {Function} handler
 * @param {string} [delegateSelector] - se passado, usa delegação de eventos
 */
export function on(target, event, handler, delegateSelector) {
  if (delegateSelector) {
    target.addEventListener(event, e => {
      const matched = e.target?.closest(delegateSelector);
      if (matched) handler.call(matched, e, matched);
    });
  } else {
    target.addEventListener(event, handler);
  }
}

/**
 * Renderiza HTML em um container, substituindo o conteúdo existente
 * @param {Element} container
 * @param {string} html
 */
export function render(container, html) {
  container.innerHTML = html;
}

/**
 * Limpa o conteúdo de um elemento
 * @param {Element} el
 */
export function clear(el) {
  el.innerHTML = '';
}

/* ==========================================================================
   RIPPLE EFFECT
   ========================================================================== */

/**
 * Adiciona efeito ripple ao clicar em um elemento.
 * O elemento deve ter `position: relative` e `overflow: hidden`.
 * @param {Element} element
 */
export function addRipple(element) {
  element.classList.add('ripple-container');

  element.addEventListener('pointerdown', e => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top:  ${y - size / 2}px;
    `;

    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });
}

/* ==========================================================================
   SCROLL HELPERS
   ========================================================================== */

/**
 * Verifica se o usuário está perto do topo da página
 * @param {number} [threshold=50]
 * @returns {boolean}
 */
export function isNearTop(threshold = 50) {
  return window.scrollY <= threshold;
}

/**
 * Rola suavemente para um elemento
 * @param {Element} element
 * @param {number} [offset=80] — offset extra no topo (ex: altura do header)
 */
export function scrollToElement(element, offset = 80) {
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ==========================================================================
   LAZY LOADING DE IMAGENS
   ========================================================================== */

/**
 * Configura IntersectionObserver para lazy loading de imagens
 * Atributos HTML necessários: data-src="url", class="lazy-img"
 */
export function setupLazyImages() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: carrega todas imagens imediatamente
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '200px' }
  );

  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

/* ==========================================================================
   DEBOUNCE & THROTTLE
   ========================================================================== */

/**
 * Debounce — atrasa a execução até que pare de ser chamada
 * @param {Function} fn
 * @param {number} delay — em ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle — limita execução a 1x por intervalo
 * @param {Function} fn
 * @param {number} interval — em ms
 * @returns {Function}
 */
export function throttle(fn, interval) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn(...args);
    }
  };
}

/* ==========================================================================
   LOCAL STORAGE HELPERS
   ========================================================================== */

/**
 * Salva valor no localStorage (serializa JSON automaticamente)
 * @param {string} key
 * @param {unknown} value
 */
export function setStorage(key, value) {
  try {
    localStorage.setItem(`pizzaflow:${key}`, JSON.stringify(value));
  } catch {
    // Ignora erros de storage cheio
  }
}

/**
 * Lê valor do localStorage (parseia JSON automaticamente)
 * @param {string} key
 * @param {unknown} [defaultValue=null]
 * @returns {unknown}
 */
export function getStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(`pizzaflow:${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Remove item do localStorage
 * @param {string} key
 */
export function removeStorage(key) {
  localStorage.removeItem(`pizzaflow:${key}`);
}

/* ==========================================================================
   MISC
   ========================================================================== */

/**
 * Verifica se o dispositivo é móvel
 * @returns {boolean}
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Verifica se o usuário prefere modo escuro
 * @returns {boolean}
 */
export function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Gera um ID único simples
 * @returns {string}
 */
export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Clamp: mantém valor dentro de [min, max]
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sleep (Promise-based delay)
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
