/**
 * PizzaFlow — Checkout Page
 * Gerencia a finalização do pedido, formulário de entrega persistido,
 * seleção de pagamento e simuladores animados (Pix Copia e Cola, Cartão).
 */

import { store } from '@store/store.js';
import { navigate } from '@router/router.js';
import { formatCurrency } from '@utils/formatters.js';
import { toastSuccess, toastError, toastInfo } from '@components/Toast.js';
import { createOrder } from '@services/api.js';

const FREE_SHIPPING_THRESHOLD = 60;
const SHIPPING_FEE = 6.90;

export default function CheckoutPage() {
  let element = null;
  let timerInterval = null;
  let selectedPayment = 'pix'; // default
  let isProcessing = false;

  // Carrega dados persistidos de entrega ou cria vazios
  let deliveryData = {
    nome: '',
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    referencia: ''
  };

  try {
    const saved = localStorage.getItem('pizzaflow_delivery_data');
    if (saved) {
      deliveryData = { ...deliveryData, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Erro ao ler localStorage', e);
  }

  /* ── MOUNT ─────────────────────────────────────────────── */
  async function mount(container) {
    const { cart } = store.getState();

    // Se o carrinho estiver vazio, volta para a home
    if (!cart || cart.count === 0) {
      setTimeout(() => navigate('#home'), 0);
      return { destroy: () => {} };
    }

    element = document.createElement('div');
    element.className = 'page';
    element.style.paddingBottom = '80px';
    container.appendChild(element);

    render();
    setupEvents();

    return { destroy };
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render() {
    if (!element) return;

    const { cart } = store.getState();
    const shipping = cart.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const pixDiscount = selectedPayment === 'pix' ? cart.total * 0.05 : 0;
    const total = cart.total + shipping - pixDiscount;

    element.innerHTML = `
      <!-- Header -->
      <header style="
        position: sticky;
        top: 0;
        z-index: var(--z-sticky);
        height: var(--header-height);
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        padding: 0 var(--content-padding-x);
        gap: var(--space-4);
      ">
        <button id="checkout-back-btn" class="btn btn-ghost btn-sm" style="padding: 0; min-width: auto; height: auto;" aria-label="Voltar ao carrinho">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 class="font-primary font-bold text-lg" style="margin: 0; flex: 1;">Finalizar Pedido</h1>
      </header>

      <div style="padding: var(--space-4) var(--content-padding-x) 0; display: flex; flex-direction: column; gap: var(--space-4);">
        
        <!-- RESUMO SIMPLIFICADO -->
        <div class="card p-4" style="border-radius: var(--radius-xl);">
          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" id="checkout-summary-trigger">
            <h2 class="font-primary font-semibold text-sm">🛍 Resumo da compra (${cart.count} ${cart.count === 1 ? 'item' : 'itens'})</h2>
            <span style="font-size: var(--text-xs); color: var(--color-primary);" id="checkout-summary-toggle-text">Ver detalhes ▾</span>
          </div>
          
          <div id="checkout-summary-details" style="display: none; margin-top: var(--space-3); max-height: 220px; overflow-y: auto; padding-right: 4px;">
            ${cart.items.map(item => `
              <div style="margin-bottom: var(--space-3); font-size: var(--text-xs);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="font-semibold">${item.quantity}×</span> ${item.name}
                  </div>
                  <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
                <div style="margin-left: 18px; opacity: 0.8; font-size: 10px;" class="text-muted mt-0.5">
                  ${item.size ? `<div>• Tamanho: ${item.size.label.split(' ')[0]}</div>` : ''}
                  ${item.border && item.border.id !== 'sem-borda' ? `<div>• Borda: ${item.border.name}</div>` : ''}
                  ${(item.freeAdditions && item.freeAdditions.length > 0) ? `<div>• Grátis: ${item.freeAdditions.join(', ')}</div>` : ''}
                  ${(item.paidAdditions && item.paidAdditions.length > 0) ? `<div>• Extras: ${item.paidAdditions.map(a => a.name).join(', ')}</div>` : ''}
                  ${item.notes ? `<div style="font-style: italic;">• Obs: "${item.notes}"</div>` : ''}
                </div>
              </div>
            `).join('')}
            <div class="divider" style="margin: var(--space-3) 0; opacity: 0.1;"></div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); font-size: var(--text-xs);">
            <div class="row-between">
              <span class="text-secondary">Subtotal</span>
              <span>${formatCurrency(cart.total)}</span>
            </div>
            <div class="row-between">
              <span class="text-secondary">Frete</span>
              <span class="${shipping === 0 ? 'text-success font-semibold' : ''}">
                ${shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
              </span>
            </div>
            ${pixDiscount > 0 ? `
              <div class="row-between text-success">
                <span>Desconto Pix (5%)</span>
                <span>− ${formatCurrency(pixDiscount)}</span>
              </div>
            ` : ''}
            <div class="row-between" style="font-size: var(--text-sm); font-weight: var(--weight-bold); margin-top: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--color-border);">
              <span>Total</span>
              <span class="text-brand" style="font-size: var(--text-base);">${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO DE ENTREGA -->
        <div class="card p-4" style="border-radius: var(--radius-xl);">
          <h2 class="font-primary font-bold text-sm mb-4">📍 Endereço de Entrega</h2>
          <form id="checkout-address-form" style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div>
              <label class="input-label" for="delivery-name">Nome Completo *</label>
              <input type="text" id="delivery-name" class="input mt-1" required placeholder="Quem irá receber o pedido?" value="${deliveryData.nome}">
            </div>
            <div>
              <label class="input-label" for="delivery-phone">Telefone de Contato *</label>
              <input type="tel" id="delivery-phone" class="input mt-1" required placeholder="(99) 99999-9999" value="${deliveryData.telefone}">
            </div>
            <div style="display: grid; grid-template-columns: 3fr 1fr; gap: var(--space-2);">
              <div>
                <label class="input-label" for="delivery-street">Rua/Avenida *</label>
                <input type="text" id="delivery-street" class="input mt-1" required placeholder="Nome da rua" value="${deliveryData.rua}">
              </div>
              <div>
                <label class="input-label" for="delivery-number">Número *</label>
                <input type="text" id="delivery-number" class="input mt-1" required placeholder="Nº" value="${deliveryData.numero}">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
              <div>
                <label class="input-label" for="delivery-neighborhood">Bairro *</label>
                <input type="text" id="delivery-neighborhood" class="input mt-1" required placeholder="Bairro" value="${deliveryData.bairro}">
              </div>
              <div>
                <label class="input-label" for="delivery-complement">Complemento</label>
                <input type="text" id="delivery-complement" class="input mt-1" placeholder="Apto, Bloco..." value="${deliveryData.complemento}">
              </div>
            </div>
            <div>
              <label class="input-label" for="delivery-reference">Ponto de Referência</label>
              <input type="text" id="delivery-reference" class="input mt-1" placeholder="Perto de onde?" value="${deliveryData.referencia}">
            </div>
          </form>
        </div>

        <!-- MÉTODOS DE PAGAMENTO -->
        <div class="card p-4" style="border-radius: var(--radius-xl);">
          <h2 class="font-primary font-bold text-sm mb-4">💳 Forma de Pagamento</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-3);" id="checkout-payment-grid">
            <button
              class="card p-3 press-effect text-left ${selectedPayment === 'pix' ? 'border-primary' : ''}"
              data-payment="pix"
              type="button"
              style="border-radius: var(--radius-lg); cursor: pointer; ${selectedPayment === 'pix' ? 'border-color: var(--color-primary); background: var(--color-primary-alpha-10);' : ''}"
            >
              <p style="font-size: 20px; margin-bottom: 4px;">⚡</p>
              <p class="font-semibold text-xs ${selectedPayment === 'pix' ? 'text-brand' : ''}">Pix</p>
              <p class="text-muted" style="font-size: 10px;">5% Desconto</p>
            </button>
            
            <button
              class="card p-3 press-effect text-left ${selectedPayment === 'credit' ? 'border-primary' : ''}"
              data-payment="credit"
              type="button"
              style="border-radius: var(--radius-lg); cursor: pointer; ${selectedPayment === 'credit' ? 'border-color: var(--color-primary); background: var(--color-primary-alpha-10);' : ''}"
            >
              <p style="font-size: 20px; margin-bottom: 4px;">💳</p>
              <p class="font-semibold text-xs ${selectedPayment === 'credit' ? 'text-brand' : ''}">Cartão de Crédito</p>
              <p class="text-muted" style="font-size: 10px;">Online</p>
            </button>

            <button
              class="card p-3 press-effect text-left ${selectedPayment === 'cash' ? 'border-primary' : ''}"
              data-payment="cash"
              type="button"
              style="border-radius: var(--radius-lg); cursor: pointer; grid-column: span 2; ${selectedPayment === 'cash' ? 'border-color: var(--color-primary); background: var(--color-primary-alpha-10);' : ''}"
            >
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <span style="font-size: 24px;">💵</span>
                <div>
                  <p class="font-semibold text-xs ${selectedPayment === 'cash' ? 'text-brand' : ''}">Pagar na Entrega (Dinheiro/Maquininha)</p>
                  <p class="text-muted" style="font-size: 10px;">Pague ao entregador na chegada</p>
                </div>
              </div>
            </button>
          </div>

          <!-- DETALHES DE ACORDO COM O PAGAMENTO SELECIONADO -->
          <div id="payment-details-container">
            ${renderPaymentMethodFields(total)}
          </div>
        </div>

        <!-- BOTÃO FINALIZAR -->
        <button
          class="btn btn-primary btn-full btn-lg mt-2"
          id="checkout-submit-btn"
          type="button"
          style="border-radius: var(--radius-xl); font-weight: var(--weight-bold); font-size: var(--text-sm);"
        >
          Confirmar e Pagar — ${formatCurrency(total)}
        </button>
      </div>

      <!-- OVERLAY DE SIMULAÇÃO DE PAGAMENTO -->
      <div id="checkout-payment-overlay" class="glass-strong" style="
        display: none;
        position: fixed;
        inset: 0;
        z-index: 1000;
        align-items: center;
        justify-content: center;
        padding: var(--space-4);
      ">
        <div class="card p-5 text-center" id="checkout-overlay-card" style="
          width: 100%;
          max-width: 400px;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border-light);
          box-shadow: var(--shadow-xl);
          background: var(--color-surface);
          animation: splashFadeIn 400ms ease forwards;
        ">
          <!-- Conteúdo dinâmico será injetado aqui pelo simulador -->
        </div>
      </div>
    `;
  }

  /* ── CAMPOS DE ACORDO COM MÉTODO ───────────────────────── */
  function renderPaymentMethodFields(total) {
    if (selectedPayment === 'pix') {
      return `
        <div class="p-3" style="background: rgba(67, 160, 71, 0.08); border-radius: var(--radius-lg); border: 1px solid rgba(67, 160, 71, 0.15);">
          <p class="text-success" style="font-size: var(--text-xs); font-weight: var(--weight-semibold); display: flex; align-items: center; gap: 6px;">
            ⚡ Cupom de Desconto Pix Ativo: Economize ${formatCurrency(total * 0.05 / 0.95)}!
          </p>
        </div>
      `;
    }

    if (selectedPayment === 'credit') {
      // Opções de parcelas
      const installmentOptions = [];
      for (let i = 1; i <= 6; i++) {
        const val = total / i;
        const desc = i === 1 ? 'à vista' : `${i}x sem juros`;
        installmentOptions.push(`<option value="${i}">${i}x de ${formatCurrency(val)} (${desc})</option>`);
      }

      return `
        <div style="display: flex; flex-direction: column; gap: var(--space-3); animation: splashFadeIn 300ms ease;">
          <div>
            <label class="input-label" for="card-number">Número do Cartão *</label>
            <input type="text" id="card-number" class="input mt-1" required placeholder="0000 0000 0000 0000" maxlength="19">
          </div>
          <div>
            <label class="input-label" for="card-name">Nome Impresso no Cartão *</label>
            <input type="text" id="card-name" class="input mt-1" required placeholder="Fulaninho de Tal">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
            <div>
              <label class="input-label" for="card-expiry">Validade *</label>
              <input type="text" id="card-expiry" class="input mt-1" required placeholder="MM/AA" maxlength="5">
            </div>
            <div>
              <label class="input-label" for="card-cvv">CVV *</label>
              <input type="text" id="card-cvv" class="input mt-1" required placeholder="123" maxlength="4">
            </div>
          </div>
          <div>
            <label class="input-label" for="card-installments">Opções de Parcelamento</label>
            <select id="card-installments" class="input mt-1" style="height: auto; padding: 12px 14px; cursor: pointer;">
              ${installmentOptions.join('')}
            </select>
          </div>
        </div>
      `;
    }

    if (selectedPayment === 'cash') {
      return `
        <div style="display: flex; flex-direction: column; gap: var(--space-3); animation: splashFadeIn 300ms ease;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="cash-need-change" style="width: 18px; height: 18px; accent-color: var(--color-primary); cursor: pointer;">
            <label for="cash-need-change" class="text-sm cursor-pointer select-none">Preciso de troco em dinheiro</label>
          </div>
          <div id="cash-change-input-wrap" style="display: none; animation: splashFadeIn 200ms ease;">
            <label class="input-label" for="cash-change-value">Troco para quanto?</label>
            <input type="number" id="cash-change-value" class="input mt-1" placeholder="Ex: R$ 50,00 ou R$ 100,00" step="0.01">
          </div>
          <div class="divider" style="margin: 4px 0; opacity: 0.1;"></div>
          <div>
            <label class="input-label">Ao entregar, você também poderá pagar com:</label>
            <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
              <span class="chip font-medium text-2xs" style="background: var(--color-surface-light);">💳 Cartão de Crédito/Débito</span>
              <span class="chip font-medium text-2xs" style="background: var(--color-surface-light);">⚡ Pix no QR Code da Maquininha</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  /* ── EVENTOS ────────────────────────────────────────────── */
  function setupEvents() {
    if (!element) return;

    // Voltar
    element.querySelector('#checkout-back-btn')?.addEventListener('click', () => {
      navigate('#cart');
    });

    // Expandir resumo
    const trigger = element.querySelector('#checkout-summary-trigger');
    const details = element.querySelector('#checkout-summary-details');
    const toggleText = element.querySelector('#checkout-summary-toggle-text');
    trigger?.addEventListener('click', () => {
      if (details.style.display === 'none') {
        details.style.display = 'block';
        toggleText.textContent = 'Ocultar detalhes ▴';
      } else {
        details.style.display = 'none';
        toggleText.textContent = 'Ver detalhes ▾';
      }
    });

    // Seleção de forma de pagamento
    element.querySelector('#checkout-payment-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-payment]');
      if (!btn || isProcessing) return;

      selectedPayment = btn.dataset.payment;
      
      // Salva dados de entrega digitados temporariamente para não perder
      updateDeliveryDataFromForm();

      render();
      setupEvents();
    });

    // Eventos específicos dos formulários (Máscaras de inputs)
    setupFormMasks();

    // Checkbox troco
    const checkboxTroco = element.querySelector('#cash-need-change');
    const wrapTroco = element.querySelector('#cash-change-input-wrap');
    checkboxTroco?.addEventListener('change', (e) => {
      wrapTroco.style.display = e.target.checked ? 'block' : 'none';
      if (e.target.checked) {
        element.querySelector('#cash-change-value')?.focus();
      }
    });

    // Enviar formulário / Finalizar
    element.querySelector('#checkout-submit-btn')?.addEventListener('click', handleFormSubmit);
  }

  /* ── MÁSCARAS DE ENTRADA ────────────────────────────────── */
  function setupFormMasks() {
    // Telefone
    const tel = element.querySelector('#delivery-phone');
    tel?.addEventListener('input', (e) => {
      let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    // Número do cartão
    const cardNum = element.querySelector('#card-number');
    cardNum?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      let formatted = val.match(/.{1,4}/g);
      e.target.value = formatted ? formatted.join(' ') : val;
    });

    // Validade do cartão
    const expiry = element.querySelector('#card-expiry');
    expiry?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 2) {
        e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
      } else {
        e.target.value = val;
      }
    });

    // CVV do cartão
    const cvv = element.querySelector('#card-cvv');
    cvv?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  /* ── COLETA DE INFORMAÇÕES DO FORMULÁRIO ────────────────── */
  function updateDeliveryDataFromForm() {
    const nome = element.querySelector('#delivery-name')?.value || '';
    const telefone = element.querySelector('#delivery-phone')?.value || '';
    const rua = element.querySelector('#delivery-street')?.value || '';
    const numero = element.querySelector('#delivery-number')?.value || '';
    const bairro = element.querySelector('#delivery-neighborhood')?.value || '';
    const complemento = element.querySelector('#delivery-complement')?.value || '';
    const referencia = element.querySelector('#delivery-reference')?.value || '';

    deliveryData = { nome, telefone, rua, numero, bairro, complemento, referencia };
    
    try {
      localStorage.setItem('pizzaflow_delivery_data', JSON.stringify(deliveryData));
    } catch (e) {}
  }

  /* ── SUBMISSÃO E VALIDAÇÃO ──────────────────────────────── */
  function handleFormSubmit() {
    if (isProcessing) return;

    // Atualiza dados
    updateDeliveryDataFromForm();

    // Valida endereço de entrega
    const form = element.querySelector('#checkout-address-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      toastError('Preencha os campos obrigatórios', 'Por favor, informe os dados de entrega.');
      return;
    }

    // Valida telefone mínimo
    if (deliveryData.telefone.replace(/\D/g, '').length < 10) {
      toastError('Telefone inválido', 'Por favor, insira um número de telefone válido.');
      element.querySelector('#delivery-phone')?.focus();
      return;
    }

    // Valida cartão de crédito se selecionado
    if (selectedPayment === 'credit') {
      const cardNum = element.querySelector('#card-number')?.value.replace(/\s/g, '') || '';
      const cardName = element.querySelector('#card-name')?.value.trim() || '';
      const cardExp = element.querySelector('#card-expiry')?.value || '';
      const cardCvv = element.querySelector('#card-cvv')?.value || '';

      if (!cardNum || cardNum.length < 16) {
        toastError('Cartão inválido', 'Número do cartão deve conter 16 dígitos.');
        element.querySelector('#card-number')?.focus();
        return;
      }
      if (!cardName) {
        toastError('Nome obrigatório', 'Informe o nome impresso no cartão.');
        element.querySelector('#card-name')?.focus();
        return;
      }
      if (!cardExp || cardExp.length < 5) {
        toastError('Validade inválida', 'Informe a validade no formato MM/AA.');
        element.querySelector('#card-expiry')?.focus();
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        toastError('CVV inválido', 'Informe o código de segurança do cartão.');
        element.querySelector('#card-cvv')?.focus();
        return;
      }
    }

    // Valida troco se selecionado dinheiro
    if (selectedPayment === 'cash') {
      const needChange = element.querySelector('#cash-need-change')?.checked;
      if (needChange) {
        const { cart } = store.getState();
        const shipping = cart.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        const total = cart.total + shipping;
        const changeVal = parseFloat(element.querySelector('#cash-change-value')?.value || 0);
        
        if (isNaN(changeVal) || changeVal < total) {
          toastError('Troco insuficiente', `O valor do troco deve ser maior que o total de ${formatCurrency(total)}`);
          element.querySelector('#cash-change-value')?.focus();
          return;
        }
      }
    }

    // Se todos os formulários válidos, inicia a simulação de pagamento
    startPaymentSimulation();
  }

  /* ── SIMULADOR DE PAGAMENTO ─────────────────────────────── */
  function startPaymentSimulation() {
    isProcessing = true;
    const overlay = element.querySelector('#checkout-payment-overlay');
    const card = element.querySelector('#checkout-overlay-card');
    if (!overlay || !card) return;

    overlay.style.display = 'flex';

    const { cart } = store.getState();
    const shipping = cart.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const pixDiscount = selectedPayment === 'pix' ? cart.total * 0.05 : 0;
    const total = cart.total + shipping - pixDiscount;

    if (selectedPayment === 'pix') {
      // SIMULAÇÃO DO PIX COM CONTEXTO REAL E CONTADOR DE TEMPO
      let secondsLeft = 300; // 5 minutos

      const pixCode = `00020101021226830014br.gov.bcb.pix2561api.pix.flow/v2/cob/957e8494b79147efba46561cf262269a52040000530398654055${total.toFixed(2)}5802BR5920PizzaFlow Delivery6009Sao Paulo62070503***6304CA4D`;

      const renderPixCard = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        
        return `
          <h3 class="font-primary font-bold text-lg mb-2">⚡ Pagamento via Pix</h3>
          <p class="text-secondary text-xs mb-4">Escaneie o QR Code ou copie o código Pix abaixo para pagar.</p>
          
          <!-- Mock QR Code SVG -->
          <div style="background: white; padding: 12px; border-radius: var(--radius-lg); width: 180px; height: 180px; margin: 0 auto 16px; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center;">
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="0.8" stroke-linecap="square" stroke-linejoin="miter">
              <path d="M1 1h6v6H1zM3 3h2v2H3zM1 17h6v6H1zM3 19h2v2H3zM17 1h6v6h-6zM19 3h2v2H-2zM9 1v2H7V1zm4 0v4h-2V1zm4 10v2h-2v-2zm-6 2v2H9v-2zm6-4h2v2h-2zm-4 8h2v2h-2zm4 2v2h-2v-2zm0-4v2h2v-2zm-8 4H7v-2h2zm4-8V7h2v2zm-2-2V5h2v2zm0 6V9h-2V7H9v6z" fill="black" />
            </svg>
          </div>
          
          <div class="row-between mb-2" style="font-size: var(--text-xs);">
            <span class="text-secondary">Total a pagar:</span>
            <span class="font-primary font-bold text-brand">${formatCurrency(total)}</span>
          </div>

          <div style="background: var(--color-surface-light); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: var(--space-4);">
            <span class="truncate text-left text-2xs text-secondary" style="flex: 1; font-family: var(--font-mono);">${pixCode}</span>
            <button id="pix-copy-btn" class="btn btn-primary btn-sm" style="font-size: 10px; padding: 6px 10px; border-radius: var(--radius-sm); flex-shrink: 0;" type="button">
              Copiar
            </button>
          </div>

          <p class="text-xs text-muted mb-4">
            Código expira em: <span style="color: var(--color-secondary); font-weight: var(--weight-bold); font-family: var(--font-mono);">${m}:${s}</span>
          </p>

          <button id="pix-confirm-btn" class="btn btn-primary btn-full" type="button" style="border-radius: var(--radius-xl); font-size: var(--text-xs);">
            Já Realizei o Pagamento
          </button>
          <button id="pix-cancel-btn" class="btn btn-ghost btn-full mt-2" style="font-size: var(--text-xs); color: var(--color-text-muted);" type="button">
            Cancelar
          </button>
        `;
      };

      card.innerHTML = renderPixCard(secondsLeft);

      // Inicia contador
      timerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(timerInterval);
          overlay.style.display = 'none';
          isProcessing = false;
          toastError('Pix Expirado', 'O tempo limite do pagamento Pix expirou. Tente novamente.');
          return;
        }
        
        // Atualiza timer sem re-renderizar todo o card para não quebrar eventos
        const timerSpan = card.querySelector('span[style*="font-family: var(--font-mono)"]');
        if (timerSpan) {
          const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
          const s = (secondsLeft % 60).toString().padStart(2, '0');
          timerSpan.textContent = `${m}:${s}`;
        }
      }, 1000);

      // Evento de cópia
      card.querySelector('#pix-copy-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(pixCode).then(() => {
          toastSuccess('Código copiado! ⚡', 'Cole no aplicativo do seu banco.');
        }).catch(() => {
          toastError('Erro ao copiar', 'Não foi possível copiar automaticamente.');
        });
      });

      // Confirmar pagamento
      card.querySelector('#pix-confirm-btn')?.addEventListener('click', () => {
        clearInterval(timerInterval);
        showSimulatedProcessing('Verificando Pix recebido...', 1500, () => {
          finalizeOrder('pix');
        });
      });

      // Cancelar
      card.querySelector('#pix-cancel-btn')?.addEventListener('click', () => {
        clearInterval(timerInterval);
        overlay.style.display = 'none';
        isProcessing = false;
        toastInfo('Pagamento cancelado', 'Selecione outra forma ou tente novamente.');
      });
    }

    if (selectedPayment === 'credit') {
      // SIMULAÇÃO DO CARTÃO ONLINE COM STATUS DE PROCESSAMENTO
      showSimulatedProcessing('Iniciando transação...', 1000, () => {
        showSimulatedProcessing('Contatando a operadora do cartão...', 1200, () => {
          showSimulatedProcessing('Aprovando pagamento...', 800, () => {
            finalizeOrder('credit');
          });
        });
      });
    }

    if (selectedPayment === 'cash') {
      // PAGAMENTO NA ENTREGA (SEM PROCESSAMENTO COMPLEXO)
      showSimulatedProcessing('Confirmando pedido com a cozinha...', 1500, () => {
        finalizeOrder('cash');
      });
    }
  }

  /* ── EXIBIR STATUS PROCESSAMENTO SIMULADO ───────────────── */
  function showSimulatedProcessing(message, duration, callback) {
    const card = element.querySelector('#checkout-overlay-card');
    if (!card) return;

    card.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; padding: var(--space-4) 0;">
        <div class="splash-loader" style="width: 100px; height: 4px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-6);">
          <div class="splash-loader-fill" style="animation: splashLoad ${duration}ms ease-in-out forwards;"></div>
        </div>
        <h3 class="font-primary font-bold text-sm mb-2">Processando Pedido</h3>
        <p class="text-secondary text-xs animate-pulse">${message}</p>
      </div>
    `;

    setTimeout(callback, duration);
  }

  /* ── SALVAR E FINALIZAR PEDIDO ──────────────────────────── */
  async function finalizeOrder(paymentMethod) {
    const { cart } = store.getState();
    const formattedAddress = `${deliveryData.rua}, Nº ${deliveryData.numero}${deliveryData.complemento ? ' (' + deliveryData.complemento + ')' : ''} - ${deliveryData.bairro}`;

    // Dispara criação do pedido (chamada de API e salvamento no Store)
    try {
      const orderParams = {
        clientName: deliveryData.nome,
        clientPhone: deliveryData.telefone,
        items: cart.items,
        address: formattedAddress,
        paymentMethod: paymentMethod,
        total: cart.total + (cart.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE)
      };

      // Chama endpoint / mock
      const order = await createOrder(orderParams);

      // Dispara atualização do endereço no store global para futuros pedidos
      store.dispatch('SET_ADDRESS', {
        formatted: formattedAddress,
        bairro: deliveryData.bairro,
        rua: deliveryData.rua,
        numero: deliveryData.numero,
        complemento: deliveryData.complemento
      });

      // Zera o carrinho
      store.dispatch('CLEAR_CART');
      
      // Feedback visual e navegação
      toastSuccess('Pedido Confirmado! 🎉', `Seu pedido #${order.id} foi enviado para a cozinha.`);
      
      // Esconde o overlay
      const overlay = element.querySelector('#checkout-payment-overlay');
      if (overlay) overlay.style.display = 'none';

      navigate('#orders');

    } catch (e) {
      console.error(e);
      toastError('Erro ao finalizar', 'Houve um problema de rede. Tente novamente.');
      
      const overlay = element.querySelector('#checkout-payment-overlay');
      if (overlay) overlay.style.display = 'none';
      isProcessing = false;
    }
  }

  /* ── DESTROY ─────────────────────────────────────────────── */
  function destroy() {
    if (timerInterval) clearInterval(timerInterval);
    element = null;
    isProcessing = false;
  }

  return { mount, destroy };
}
