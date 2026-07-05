/**
 * PizzaFlow — Toast Component
 * Notificações tipo snackbar com tipos, auto-dismiss e animações.
 *
 * Uso:
 *   showToast({ type: 'success', title: 'Adicionado!', message: '...', duration: 3000 })
 */

import { uid } from '@utils/helpers.js';

/* ==========================================================================
   CONFIGURAÇÃO
   ========================================================================== */

const DEFAULT_DURATION = 3500; // ms

const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
  cart:    '🛒',
};

/* ==========================================================================
   FILA DE TOASTS
   ========================================================================== */

/** @type {Map<string, { el: HTMLElement, timer: number }>} */
const activeToasts = new Map();

/* ==========================================================================
   API PÚBLICA
   ========================================================================== */

/**
 * Exibe uma notificação toast
 * @param {object} options
 * @param {'success'|'error'|'warning'|'info'|'cart'} [options.type='info']
 * @param {string} options.title
 * @param {string} [options.message]
 * @param {number} [options.duration] — ms, 0 = não fecha automaticamente
 * @returns {string} id do toast
 */
export function showToast({
  type = 'info',
  title,
  message = '',
  duration = DEFAULT_DURATION,
}) {
  const container = document.getElementById('toast-container');
  if (!container) return '';

  const id = uid();
  const icon = TOAST_ICONS[type] ?? TOAST_ICONS.info;

  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <div class="toast-body">
      <p class="toast-title">${escapeHtml(title)}</p>
      ${message ? `<p class="toast-message">${escapeHtml(message)}</p>` : ''}
    </div>
    <button
      class="toast-close"
      aria-label="Fechar notificação"
      data-toast-id="${id}"
    >×</button>
  `;

  // Evento de fechar
  toast.querySelector('.toast-close')?.addEventListener('click', () => {
    dismissToast(id);
  });

  container.appendChild(toast);

  // Auto-dismiss
  let timer = 0;
  if (duration > 0) {
    timer = window.setTimeout(() => dismissToast(id), duration);
  }

  activeToasts.set(id, { el: toast, timer });

  return id;
}

/**
 * Fecha um toast pelo ID
 * @param {string} id
 */
export function dismissToast(id) {
  const entry = activeToasts.get(id);
  if (!entry) return;

  clearTimeout(entry.timer);

  entry.el.classList.add('dismissing');

  entry.el.addEventListener('animationend', () => {
    entry.el.remove();
    activeToasts.delete(id);
  }, { once: true });
}

/**
 * Fecha todos os toasts ativos
 */
export function dismissAllToasts() {
  activeToasts.forEach((_, id) => dismissToast(id));
}

/* ==========================================================================
   ATALHOS TIPADOS
   ========================================================================== */

/** Toast de sucesso */
export const toastSuccess = (title, message, duration) =>
  showToast({ type: 'success', title, message, duration });

/** Toast de erro */
export const toastError = (title, message, duration) =>
  showToast({ type: 'error', title, message, duration });

/** Toast de aviso */
export const toastWarning = (title, message, duration) =>
  showToast({ type: 'warning', title, message, duration });

/** Toast informativo */
export const toastInfo = (title, message, duration) =>
  showToast({ type: 'info', title, message, duration });

/** Toast de item adicionado ao carrinho */
export const toastCart = (productName) =>
  showToast({
    type: 'cart',
    title: 'Adicionado ao carrinho!',
    message: productName,
    duration: 2500,
  });

/* ==========================================================================
   UTILITÁRIO INTERNO
   ========================================================================== */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
