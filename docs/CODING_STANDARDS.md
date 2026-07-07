# Padrões de Código (Coding Standards) — PizzaFlow

Este documento estabelece as diretrizes estilísticas e as restrições técnicas para a escrita de código no repositório do **PizzaFlow**. A aderência a estes padrões é obrigatória para manter a consistência e a alta legibilidade da base de código.

---

## 🚀 1. Uso Estrito de ES Modules
* **Padrão**: Toda exportação e importação de módulos JavaScript deve ser declarada nativamente através de `import` e `export`.
* **Proibido**: Uso de sintaxes baseadas em CommonJS (`require` / `module.exports`).

```javascript
// ✅ CERTO
import { EventBus } from '@/core/EventBus.js';
export class ProductCard { ... }

// ❌ ERRADO
const EventBus = require('../core/EventBus');
module.exports = { ProductCard };
```

---

## ✒️ 2. Padrões de Nomenclatura (Naming Conventions)

### PascalCase
* **Uso**: Classes, Construtores, Componentes de UI (Fábricas) e Páginas.
* **Exemplos**: `ProductModal.js`, `CartItem.js`, `OrderPage.js`.

### camelCase
* **Uso**: Variáveis, propriedades de objetos, métodos, funções utilitárias e nomes de arquivos de serviços/utils.
* **Exemplos**: `currentQuantity`, `calculateTotal()`, `api.js`, `formatters.js`.

### kebab-case
* **Uso**: Nomes de pastas, seletores CSS e arquivos de estilo.
* **Exemplos**: `src/domain/cart/`, `product-modal.css`.

### UPPER_SNAKE_CASE
* **Uso**: Constantes globais imutáveis e dicionários de enum.
* **Exemplos**: `DEFAULT_TAX_RATE`, `ORDER_STATUS_FLOW`.

---

## 🧩 3. Clean Code & Qualidade de Software

### Responsabilidade Única (Single Responsibility Principle - SRP)
Cada arquivo, classe ou função fábrica deve possuir uma única preocupação e um único motivo para ser modificado.

```javascript
// ❌ ERRADO: Função faz cálculo, manipula DOM e monta objeto
function addPizza(flavor, size) {
  const price = size === 'G' ? 115 : 82;
  const itemHtml = `<div class="item">${flavor} - R$${price}</div>`;
  document.getElementById('cart').innerHTML += itemHtml;
}

// ✅ CERTO: Responsabilidades divididas em locais dedicados
// O PriceEngine faz o cálculo. O Domínio gerencia o objeto. O componente cuida do DOM.
const item = new CartItem({ id: flavor, price: PriceEngine.calculate({ flavor, size }) });
CartStore.add(item);
```

### Funções Pequenas
* **Regra**: Nenhuma função ou método deve ultrapassar **30 linhas de código** sempre que possível. Caso a função cresça, fatore-a extraindo sub-lógicas para sub-funções puras.

### Sem Código Duplicado (DRY — Don't Repeat Yourself)
* **Regra**: Evite repetir blocos de lógica de manipulação DOM, conversão de dados ou validação. Centralize funções genéricas sob a pasta `src/js/utils/`.

---

## 💬 4. Documentação & Comentários

### JSDoc Obrigatório em APIs Públicas
Toda classe, método ou função pública exportada deve obrigatoriamente possuir bloco descritivo JSDoc indicando parâmetros e tipos de retorno.

```javascript
/**
 * Calcula o valor líquido aplicando o cupom ao subtotal.
 * @param {number} subtotal - O valor bruto dos produtos.
 * @param {object} coupon - Objeto contendo o valor e tipo de desconto.
 * @returns {number} O valor com desconto aplicado.
 */
export function applyDiscount(subtotal, coupon) {
  // ...
}
```

### Comentários Apenas quando Agregarem Valor
* **Regra**: Não descreva o que o código está fazendo se a leitura da linha for autoexplicativa. Comente apenas o **porquê** de decisões arquiteturais complexas ou de hacks necessários devido a limitações do navegador.

```javascript
// ❌ ERRADO (Comentário inútil)
// Incrementa a quantidade em 1
quantity += 1;

// ✅ CERTO (Explica a razão de negócio da regra de contorno)
// Limitamos a adição do sabor à brotinho devido à limitação de espaço físico no forno de pedra
if (size === 'broto' && flavors.length > 1) {
  throw new Error('Pizzas broto suportam apenas um sabor.');
}
```
