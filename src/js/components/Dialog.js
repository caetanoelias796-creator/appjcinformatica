/**
 * PizzaFlow — Dialog Component
 * Modal/bottom-sheet reutilizável com suporte a ações customizadas.
 *
 * Uso:
 *   showDialog({ title: 'Confirmar', body: '<p>...</p>', actions: [...] })
 */

import { uid } from '@utils/helpers.js';

/* ==========================================================================
   ESTADO
   ========================================================================== */

/** ID do dialog atual aberto */
let currentDialogId = null;

/* ==========================================================================
   API PÚBLICA
   ========================================================================== */

/**
 * Exibe um dialog/bottom-sheet
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} options.body — HTML da mensagem/conteúdo
 * @param {DialogAction[]} [options.actions]
 * @param {boolean} [options.closable=true] — fecha ao clicar no backdrop
 * @param {Function} [options.onClose]
 * @returns {string} id do dialog
 *
 * @typedef {{ text: string, type?: 'primary'|'ghost'|'danger', handler?: Function }} DialogAction
 */
export function showDialog({
  title = '',
  body = '',
  actions = [],
  closable = true,
  onClose,
}) {
  // Fecha dialog anterior se houver
  if (currentDialogId) {
    closeDialog(currentDialogId);
  }

  const container = document.getElementById('dialog-container');
  if (!container) return '';

  const id = uid();
  currentDialogId = id;

  // Define ARIA no container
  container.setAttribute('aria-hidden', 'false');

  // Renderiza ações
  const actionsHtml = actions.map(action => {
    const type = action.type === 'danger'
      ? 'btn-outline-primary'
      : action.type === 'ghost'
        ? 'btn-ghost'
        : 'btn-primary';

    return `
      <button
        class="btn ${type} flex-1"
        data-dialog-action="${escapeAttr(action.text)}"
      >
        ${action.text}
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div
      class="dialog-backdrop"
      id="dialog-backdrop-${id}"
      role="presentation"
    >
      <div
        class="dialog"
        id="dialog-${id}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title-${id}"
      >
        <div class="dialog-handle" aria-hidden="true"></div>

        ${title ? `
          <div class="dialog-header">
            <h3 class="dialog-title" id="dialog-title-${id}">${title}</h3>
            <button
              class="btn-icon"
              id="dialog-close-${id}"
              aria-label="Fechar"
            >×</button>
          </div>
        ` : ''}

        <div class="dialog-body">
          ${body}
        </div>

        ${actionsHtml ? `
          <div class="dialog-footer">
            ${actionsHtml}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Eventos
  const backdrop = container.querySelector(`#dialog-backdrop-${id}`);
  const dialog   = container.querySelector(`#dialog-${id}`);
  const closeBtn = container.querySelector(`#dialog-close-${id}`);

  // Fechar no backdrop
  if (closable) {
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDialog(id, onClose);
    });
  }

  // Botão de fechar (X)
  closeBtn?.addEventListener('click', () => closeDialog(id, onClose));

  // Ações customizadas
  actions.forEach(action => {
    const btn = container.querySelector(`[data-dialog-action="${escapeAttr(action.text)}"]`);
    btn?.addEventListener('click', () => {
      action.handler?.();
      closeDialog(id, onClose);
    });
  });

  // Fechar com Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closable) {
      closeDialog(id, onClose);
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Foco inicial no dialog
  dialog?.focus?.();

  // Previne scroll do body
  document.body.style.overflow = 'hidden';

  return id;
}

/**
 * Fecha o dialog com ID especificado
 * @param {string} id
 * @param {Function} [onClose]
 */
export function closeDialog(id, onClose) {
  const container = document.getElementById('dialog-container');
  if (!container) return;

  const backdrop = container.querySelector(`#dialog-backdrop-${id}`);
  const dialog   = container.querySelector(`#dialog-${id}`);

  if (dialog) {
    dialog.style.animation = 'slideDownFade var(--transition-normal) ease both';
  }

  if (backdrop) {
    backdrop.style.animation = 'fadeOut var(--transition-normal) ease both';

    backdrop.addEventListener('animationend', () => {
      container.innerHTML = '';
      container.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      currentDialogId = null;
      onClose?.();
    }, { once: true });
  } else {
    container.innerHTML = '';
    container.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentDialogId = null;
    onClose?.();
  }
}

/**
 * Fecha o dialog atualmente aberto
 */
export function closeCurrentDialog() {
  if (currentDialogId) closeDialog(currentDialogId);
}

/* ==========================================================================
   DIALOGS PRONTOS
   ========================================================================== */

/**
 * Dialog de confirmação
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmText='Confirmar']
 * @param {string} [options.cancelText='Cancelar']
 * @param {Function} [options.onConfirm]
 * @param {Function} [options.onCancel]
 */
export function showConfirmDialog({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  return showDialog({
    title,
    body: `<p class="text-secondary">${message}</p>`,
    actions: [
      {
        text: cancelText,
        type: 'ghost',
        handler: onCancel,
      },
      {
        text: confirmText,
        type: 'primary',
        handler: onConfirm,
      },
    ],
  });
}

/* ==========================================================================
   UTILITÁRIO INTERNO
   ========================================================================== */

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
