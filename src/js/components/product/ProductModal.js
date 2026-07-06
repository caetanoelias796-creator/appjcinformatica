/**
 * PizzaFlow — Product Modal Component
 * Modal principal de customização e compra de pizzas e outros produtos.
 */

import { store } from '@store/store.js';
import { fetchBorders, fetchProducts } from '@services/api.js';
import { toastCart } from '@components/Toast.js';

// Core imports (RFC-001)
import { EventBus } from '@/core/EventBus.js';
import { ProductBuilder } from '@/core/ProductBuilder.js';
import { PizzaRules } from '@/core/PizzaRules.js';
import { PriceEngine } from '@/core/PriceEngine.js';
import { CartStore } from '@/core/CartStore.js';

import { PizzaPreview } from './PizzaPreview.js';
import { SizeSelector } from './SizeSelector.js';
import { FlavorSelector } from './FlavorSelector.js';
import { CrustSelector } from './CrustSelector.js';
import { ExtraSelector } from './ExtraSelector.js';
import { QuantitySelector } from './QuantitySelector.js';
import { PriceSummary } from './PriceSummary.js';

import './productModal.css';

/* ==========================================================================
   ESTADO DO COMPONENTE
   ========================================================================== */

let _isOpen = false;
let _allProducts = [];
let _bordersList = {};
let _builder = null;

// Sub-componentes
let _preview = null;
let _sizeSel = null;
let _flavorSel = null;
let _crustSel = null;
let _extraSel = null;
let _qtySel = null;
let _summary = null;

/* ==========================================================================
   API PÚBLICA
   ========================================================================== */

/**
 * Abre o modal de customização para o produto especificado
 * @param {string} productId - ID do produto a carregar
 */
export async function openProductModal(productId) {
  if (_isOpen) return;

  const container = document.getElementById('dialog-container');
  if (!container) return;

  // Mostra loading global no store
  store.dispatch('SET_LOADING', true);

  try {
    // Carrega dados se vazios
    if (_allProducts.length === 0) {
      const [products, borders] = await Promise.all([
        fetchProducts(),
        fetchBorders()
      ]);
      _allProducts = products || [];
      _bordersList = borders || {};
    }

    const product = _allProducts.find(p => p.id === productId);
    if (!product) throw new Error(`Produto "${productId}" não encontrado`);

    _isOpen = true;
    
    // Determina se o produto é pizza
    const isPizza = product.category === 'pizza-classica' || 
                    product.category === 'pizza-especial' || 
                    (product.category === 'sobremesas' && product.sizes && product.sizes.length > 0);

    const hasSizes = product.sizes && product.sizes.length > 0;

    // Inicializa o ProductBuilder local
    _builder = new ProductBuilder(product);
    
    const defaultSize = product.sizes?.[1] || product.sizes?.[0] || null;
    if (defaultSize) {
      _builder.setSize(defaultSize);
    }

    // Inicializa sub-componentes
    _preview = PizzaPreview();
    
    if (hasSizes) {
      _sizeSel = SizeSelector({
        onChange: (size) => {
          _builder.setSize(size);
          // Validação usando PizzaRules (limita sabores ao tamanho se menor)
          const max = PizzaRules.maxFlavors(size);
          const currentFlavors = _builder.build().flavors;
          if (currentFlavors.length > max) {
            _builder.setFlavors(currentFlavors.slice(0, max));
          }
          triggerUpdate();
        }
      });
    }

    if (isPizza) {
      _flavorSel = FlavorSelector({
        allProducts: _allProducts,
        onAdd: (flavor) => {
          const currentFlavors = _builder.build().flavors;
          const currentSize = _builder.build().size;
          if (PizzaRules.canAddFlavor(currentSize, currentFlavors.length)) {
            _builder.addFlavor(flavor);
            triggerUpdate();
          }
        },
        onRemove: (flavorId) => {
          _builder.removeFlavor(flavorId);
          triggerUpdate();
        }
      });
      _crustSel = CrustSelector({
        bordersList: _bordersList,
        onChange: (crust) => {
          _builder.setCrust(crust);
          triggerUpdate();
        }
      });
      _extraSel = ExtraSelector({
        onAdd: (extra) => {
          _builder.addExtra(extra);
          triggerUpdate();
        },
        onRemove: (extraId) => {
          _builder.removeExtra(extraId);
          triggerUpdate();
        }
      });
    }

    _qtySel = QuantitySelector({
      onChange: (qty) => {
        _builder.setQuantity(qty);
        triggerUpdate();
      }
    });
    _summary = PriceSummary();

    // Renderiza estrutura base do modal
    container.setAttribute('aria-hidden', 'false');
    container.innerHTML = `
      <div class="product-modal-backdrop" id="product-modal-backdrop" role="presentation">
        <div 
          class="product-modal-container" 
          id="product-modal-container"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="product-modal-title"
          tabindex="-1"
        >
          <!-- Header -->
          <div class="product-modal-header">
            <h2 class="product-modal-title" id="product-modal-title">${isPizza ? 'Customizar Pizza' : 'Adicionar ao Pedido'}</h2>
            <button class="product-modal-close-btn" id="product-modal-close" aria-label="Fechar modal" type="button">×</button>
          </div>

          <!-- Conteúdo Rolável -->
          <div class="product-modal-content" id="product-modal-content">
            
            <!-- Hero / Preview -->
            <div class="product-modal-hero">
              <div id="preview-mount"></div>
              <div class="product-modal-info">
                <h1 class="product-modal-name">${product.name}</h1>
                <p class="product-modal-desc">${product.description}</p>
                <div class="product-modal-meta">
                  <span>⭐ ${product.rating.toFixed(1)} (${product.reviewCount} avaliações)</span>
                  <span>⏱️ ${product.prepTime || '25-35 min'}</span>
                </div>
              </div>
            </div>

            <!-- Formulários / Seletores -->
            <div id="size-selector-mount"></div>
            ${isPizza ? `
              <div id="flavor-selector-mount"></div>
              <div id="crust-selector-mount"></div>
              <div id="extra-selector-mount"></div>
            ` : ''}
            <div id="quantity-selector-mount"></div>

            <!-- Observações -->
            <section class="product-modal-section">
              <div class="product-modal-section-title-wrapper">
                <h3 class="product-modal-section-title">
                  <span>✍️ Observações</span>
                </h3>
                <span class="product-modal-section-badge">Opcional</span>
              </div>
              <textarea 
                class="note-textarea" 
                id="product-modal-note" 
                placeholder="Ex: sem cebola, bem assada, sem gelo..."
                rows="3"
                aria-label="Observações para o preparo"
              ></textarea>
            </section>

          </div>

          <!-- Rodapé / Summary -->
          <div class="product-modal-footer">
            <div id="price-summary-mount"></div>
            <div class="product-modal-actions">
              <button class="product-modal-submit-btn" id="product-modal-submit" type="button">
                <span>Adicionar ao Pedido</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Monta sub-componentes nos placeholders
    container.querySelector('#preview-mount').appendChild(_preview.build());
    
    if (hasSizes) {
      container.querySelector('#size-selector-mount').appendChild(_sizeSel.build());
    }
    
    if (isPizza) {
      container.querySelector('#flavor-selector-mount').appendChild(_flavorSel.build());
      container.querySelector('#crust-selector-mount').appendChild(_crustSel.build());
      container.querySelector('#extra-selector-mount').appendChild(_extraSel.build());
    }
    
    container.querySelector('#quantity-selector-mount').appendChild(_qtySel.build());
    container.querySelector('#price-summary-mount').appendChild(_summary.build());

    // Dispara atualização inicial
    triggerUpdate();

    // Eventos
    setupModalEvents(container);

    // Animação de entrada
    setTimeout(() => {
      const backdrop = container.querySelector('#product-modal-backdrop');
      backdrop?.classList.add('open');
      container.querySelector('#product-modal-container')?.focus();
    }, 50);

  } catch (err) {
    console.error('[ProductModal]', err);
  } finally {
    store.dispatch('SET_LOADING', false);
  }
}

/**
 * Fecha o modal de produto
 */
export function closeProductModal() {
  if (!_isOpen) return;

  const container = document.getElementById('dialog-container');
  const backdrop = container?.querySelector('#product-modal-backdrop');
  const modalContainer = container?.querySelector('#product-modal-container');

  if (modalContainer) {
    modalContainer.style.transform = 'translateY(30px) scale(0.95)';
  }

  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.addEventListener('transitionend', () => {
      cleanup();
    }, { once: true });
  } else {
    cleanup();
  }
}

/* ==========================================================================
   UTILITÁRIOS INTERNOS
   ========================================================================== */

function cleanup() {
  const container = document.getElementById('dialog-container');
  if (container) {
    container.innerHTML = '';
    container.setAttribute('aria-hidden', 'true');
  }

  // Destrói os sub-componentes (limpando suas inscrições de eventos)
  _preview?.destroy?.();
  _sizeSel?.destroy?.();
  _flavorSel?.destroy?.();
  _crustSel?.destroy?.();
  _extraSel?.destroy?.();
  _qtySel?.destroy?.();
  _summary?.destroy?.();

  // Publica evento de fechamento
  EventBus.publish('modal:close');

  _isOpen = false;
  _builder = null;
  document.body.style.overflow = '';
}

function setupModalEvents(container) {
  const backdrop = container.querySelector('#product-modal-backdrop');
  const closeBtn = container.querySelector('#product-modal-close');
  const submitBtn = container.querySelector('#product-modal-submit');
  const noteArea = container.querySelector('#product-modal-note');
  const modalContent = container.querySelector('#product-modal-container');

  // Impedir scroll de fundo
  document.body.style.overflow = 'hidden';

  // Fechar no botão X
  closeBtn?.addEventListener('click', closeProductModal);

  // Fechar ao clicar fora (backdrop)
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeProductModal();
  });

  // Atualiza observação utilizando o builder
  noteArea?.addEventListener('input', (e) => {
    _builder.setObservation(e.target.value);
    triggerUpdate();
  });

  // Salvar/Submit
  submitBtn?.addEventListener('click', () => {
    handleSubmit();
  });

  // Teclado (ESC e Focus Trap)
  const handleKeyDown = (e) => {
    if (!_isOpen) {
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    // ESC fecha
    if (e.key === 'Escape') {
      closeProductModal();
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }

    // Focus trap
    if (e.key === 'Tab') {
      const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusables = modalContent.querySelectorAll(focusableSelector);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
}

function triggerUpdate() {
  if (!_builder) return;
  const config = _builder.build();
  const pricing = PriceEngine.calculate(config);
  EventBus.publish('product:updated', { config, pricing });
}

function handleSubmit() {
  if (!_builder) return;
  const config = _builder.build();

  // Executa validação de regras de negócio antes de adicionar ao carrinho
  const validation = PizzaRules.validate(config);
  if (!validation.isValid) {
    alert(validation.error);
    return;
  }

  // Adiciona ao CartStore (Core) que emite os eventos no EventBus automaticamente
  CartStore.add(config);

  // Mantemos o dispatch na store legada para que os componentes não migrados também reajam
  const pricing = PriceEngine.calculate(config);
  store.dispatch('ADD_TO_CART', {
    id: config.id,
    name: config.name,
    price: pricing.total / config.quantity,
    image: config.image,
    quantity: config.quantity,
    size: config.size,
    crust: config.crust,
    extras: config.extras,
    note: config.note,
    flavors: config.flavors
  });

  // Exibe feedback visual
  toastCart(config.name);

  // Fecha o modal
  closeProductModal();
}
