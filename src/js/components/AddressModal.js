/**
 * PizzaFlow — AddressModal Component
 * Modal de seleção e cadastro de endereço com consulta de CEP (ViaCEP API).
 */

import { store }         from '@store/store.js';
import { getStorage, setStorage } from '@utils/helpers.js';
import { toastSuccess, toastError } from '@components/Toast.js';

/* ==========================================================================
   HELPERS
   ========================================================================== */

/**
 * Consulta o ViaCEP e retorna o endereço
 * @param {string} cep
 * @returns {Promise<object>}
 */
async function fetchCEP(cep) {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) throw new Error('CEP inválido');

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  const data = await res.json();

  if (data.erro) throw new Error('CEP não encontrado');
  return data;
}

/**
 * Formata endereço para exibição
 * @param {object} data
 * @returns {string}
 */
function formatAddress(data) {
  const parts = [data.logradouro];
  if (data.numero)      parts.push(`nº ${data.numero}`);
  if (data.complemento) parts.push(data.complemento);
  if (data.bairro)      parts.push(data.bairro);
  if (data.localidade && data.uf) parts.push(`${data.localidade}/${data.uf}`);
  return parts.filter(Boolean).join(', ');
}

/* ==========================================================================
   COMPONENTE
   ========================================================================== */

let _isOpen = false;
let _container = null;

/**
 * Inicializa o modal de endereço
 * @param {HTMLElement} container — #address-modal
 */
export function initAddressModal(container) {
  _container = container;
}

/**
 * Abre o modal de endereço
 */
export function openAddressModal() {
  if (_isOpen || !_container) return;
  _isOpen = true;

  const savedHistory = getStorage('address-history', []);
  const currentAddress = store.getState().user.addressData;

  _container.innerHTML = `
    <div
      class="dialog-backdrop"
      id="address-backdrop"
      role="presentation"
    >
      <div
        class="dialog"
        id="address-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-dialog-title"
        style="max-height: 90vh; overflow-y: auto;"
      >
        <div class="dialog-handle" aria-hidden="true"></div>

        <!-- Header -->
        <div class="dialog-header">
          <h2 class="dialog-title" id="address-dialog-title">📍 Endereço de entrega</h2>
          <button class="btn-icon" id="address-close-btn" aria-label="Fechar" type="button">×</button>
        </div>

        <!-- Histórico de endereços -->
        ${savedHistory.length > 0 ? `
          <div style="padding: 0 var(--space-5) var(--space-4);">
            <p style="font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-3);">
              Endereços recentes
            </p>
            <div id="address-history-list">
              ${savedHistory.map((addr, i) => `
                <button
                  class="address-history-item ${currentAddress?.cep === addr.cep && currentAddress?.numero === addr.numero ? 'active' : ''}"
                  data-address-index="${i}"
                  type="button"
                >
                  <span style="font-size: 20px; flex-shrink: 0;" aria-hidden="true">
                    ${i === 0 ? '🏠' : '📌'}
                  </span>
                  <div style="flex: 1; text-align: left; min-width: 0;">
                    <p style="font-size: var(--text-sm); font-weight: var(--weight-semibold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${addr.logradouro}, ${addr.numero || 'S/N'}
                    </p>
                    <p style="font-size: var(--text-xs); color: var(--color-text-muted);">
                      ${addr.bairro} — ${addr.localidade}/${addr.uf}
                    </p>
                  </div>
                  ${currentAddress?.cep === addr.cep && currentAddress?.numero === addr.numero
                    ? `<span style="color: var(--color-success); font-size: 16px;" aria-label="Selecionado">✓</span>`
                    : ''}
                </button>
              `).join('')}
            </div>
            <div class="divider" style="margin: var(--space-4) 0; opacity: 0.4;"></div>
          </div>
        ` : ''}

        <!-- Formulário de novo endereço -->
        <div class="dialog-body" style="padding-top: 0;">
          <p style="font-size: var(--text-sm); font-weight: var(--weight-semibold); margin-bottom: var(--space-4);">
            Novo endereço
          </p>

          <!-- CEP -->
          <div class="input-group">
            <label class="input-label" for="addr-cep">CEP</label>
            <div style="position: relative; display: flex; gap: var(--space-2);">
              <input
                class="input"
                type="text"
                id="addr-cep"
                placeholder="00000-000"
                maxlength="9"
                inputmode="numeric"
                style="flex: 1;"
                autocomplete="postal-code"
              />
              <button
                class="btn btn-outline-primary btn-sm"
                id="addr-cep-btn"
                type="button"
                style="flex-shrink: 0; white-space: nowrap;"
              >
                Buscar
              </button>
            </div>
            <p id="addr-cep-error" class="input-error" style="display:none;"></p>
          </div>

          <!-- Rua (preenchida automaticamente) -->
          <div class="input-group">
            <label class="input-label" for="addr-street">Rua / Logradouro</label>
            <input
              class="input"
              type="text"
              id="addr-street"
              placeholder="Buscando CEP..."
              autocomplete="street-address"
              readonly
            />
          </div>

          <!-- Número + Complemento -->
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--space-3);">
            <div class="input-group">
              <label class="input-label" for="addr-number">Número</label>
              <input
                class="input"
                type="text"
                id="addr-number"
                placeholder="Ex: 123"
                inputmode="numeric"
                autocomplete="address-line2"
              />
            </div>
            <div class="input-group">
              <label class="input-label" for="addr-complement">Complemento</label>
              <input
                class="input"
                type="text"
                id="addr-complement"
                placeholder="Apto, casa, bloco..."
                autocomplete="address-line3"
              />
            </div>
          </div>

          <!-- Bairro + Cidade -->
          <div class="input-group">
            <label class="input-label" for="addr-neighborhood">Bairro</label>
            <input
              class="input"
              type="text"
              id="addr-neighborhood"
              placeholder="Bairro"
              readonly
            />
          </div>

          <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: var(--space-3);">
            <div class="input-group">
              <label class="input-label" for="addr-city">Cidade</label>
              <input
                class="input"
                type="text"
                id="addr-city"
                placeholder="Cidade"
                readonly
              />
            </div>
            <div class="input-group">
              <label class="input-label" for="addr-state">UF</label>
              <input
                class="input"
                type="text"
                id="addr-state"
                placeholder="UF"
                readonly
                maxlength="2"
              />
            </div>
          </div>

          <!-- Referência -->
          <div class="input-group">
            <label class="input-label" for="addr-ref">Ponto de referência</label>
            <input
              class="input"
              type="text"
              id="addr-ref"
              placeholder="Ex: Próximo ao mercado..."
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button class="btn btn-ghost flex-1" id="address-cancel-btn" type="button">
            Cancelar
          </button>
          <button class="btn btn-primary flex-1" id="address-save-btn" type="button">
            Salvar endereço
          </button>
        </div>
      </div>
    </div>
  `;

  // Mascara o CEP enquanto digita
  const cepInput = _container.querySelector('#addr-cep');
  cepInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
    e.target.value = v;
  });

  // Busca CEP ao clicar
  _container.querySelector('#addr-cep-btn')?.addEventListener('click', () => {
    handleCEPSearch();
  });

  // Busca CEP ao pressionar Enter
  cepInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCEPSearch();
  });

  // Busca CEP automaticamente quando completo
  cepInput?.addEventListener('input', (e) => {
    const clean = e.target.value.replace(/\D/g, '');
    if (clean.length === 8) handleCEPSearch();
  });

  // Selecionar endereço do histórico
  _container.querySelector('#address-history-list')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-address-index]');
    if (!item) return;
    const idx = parseInt(item.dataset.addressIndex, 10);
    selectFromHistory(savedHistory[idx]);
  });

  // Fechar
  _container.querySelector('#address-close-btn')?.addEventListener('click', closeAddressModal);
  _container.querySelector('#address-cancel-btn')?.addEventListener('click', closeAddressModal);
  _container.querySelector('#address-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'address-backdrop') closeAddressModal();
  });

  // Salvar
  _container.querySelector('#address-save-btn')?.addEventListener('click', handleSave);

  // Fechar com Escape
  const onKey = (e) => {
    if (e.key === 'Escape') {
      closeAddressModal();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  // Previne scroll do body
  document.body.style.overflow = 'hidden';
}

/* ==========================================================================
   HANDLERS
   ========================================================================== */

/** Estado interno do CEP pesquisado */
let _cepData = null;

async function handleCEPSearch() {
  const cepInput = _container?.querySelector('#addr-cep');
  const errorEl  = _container?.querySelector('#addr-cep-error');
  const btn      = _container?.querySelector('#addr-cep-btn');
  if (!cepInput || !btn) return;

  const cep = cepInput.value;

  // Loading state
  btn.textContent = '...';
  btn.disabled = true;
  if (errorEl) errorEl.style.display = 'none';

  try {
    const data = await fetchCEP(cep);
    _cepData = data;
    fillAddressForm(data);
    // Foca no campo número
    _container?.querySelector('#addr-number')?.focus();
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message || 'CEP não encontrado';
      errorEl.style.display = 'block';
    }
    _cepData = null;
  } finally {
    btn.textContent = 'Buscar';
    btn.disabled = false;
  }
}

function fillAddressForm(data) {
  const set = (id, val) => {
    const el = _container?.querySelector(`#${id}`);
    if (el && val) el.value = val;
  };
  set('addr-street',       data.logradouro);
  set('addr-neighborhood', data.bairro);
  set('addr-city',         data.localidade);
  set('addr-state',        data.uf);
}

function selectFromHistory(addr) {
  store.dispatch('SET_ADDRESS', addr);
  toastSuccess('Endereço selecionado!', addr.formatted);
  closeAddressModal();
  refreshHeader();
}

function handleSave() {
  if (!_cepData) {
    toastError('Busque um CEP', 'Informe um CEP válido para continuar.');
    return;
  }

  const get = (id) => _container?.querySelector(`#${id}`)?.value?.trim() || '';

  const numero      = get('addr-number');
  const complemento = get('addr-complement');
  const referencia  = get('addr-ref');

  if (!numero) {
    toastError('Número obrigatório', 'Informe o número do endereço.');
    _container?.querySelector('#addr-number')?.focus();
    return;
  }

  const addressData = {
    ..._cepData,
    numero,
    complemento,
    referencia,
    formatted: formatAddress({ ..._cepData, numero, complemento }),
  };

  // Salva no histórico (máx 5)
  const history = getStorage('address-history', []);
  const updated = [
    addressData,
    ...history.filter(a => !(a.cep === addressData.cep && a.numero === addressData.numero)),
  ].slice(0, 5);
  setStorage('address-history', updated);

  store.dispatch('SET_ADDRESS', addressData);
  toastSuccess('Endereço salvo!', addressData.formatted);
  closeAddressModal();
  refreshHeader();
}

/* ==========================================================================
   FECHAR
   ========================================================================== */

export function closeAddressModal() {
  if (!_isOpen || !_container) return;
  _isOpen = false;
  _cepData = null;

  const dialog   = _container.querySelector('#address-dialog');
  const backdrop = _container.querySelector('#address-backdrop');

  if (dialog) dialog.style.animation = 'slideDownFade var(--transition-normal) ease both';
  if (backdrop) {
    backdrop.style.animation = 'fadeOut var(--transition-normal) ease both';
    backdrop.addEventListener('animationend', () => {
      _container.innerHTML = '';
      document.body.style.overflow = '';
    }, { once: true });
  } else {
    _container.innerHTML = '';
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   REFRESH HEADER ADDRESS TEXT
   ========================================================================== */

function refreshHeader() {
  const el = document.getElementById('header-address-value');
  if (!el) return;
  const { user } = store.getState();
  const addr = user.address || 'Selecione um endereço';
  // Trunca para 28 chars
  el.textContent = addr.length > 28 ? addr.slice(0, 28) + '…' : addr;
}
