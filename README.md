# PizzaFlow 🍕

> Sistema SaaS de Delivery de Pizza — Moderno, Rápido e Escalável

![PizzaFlow](./public/images/banner_promo_1.png)

---

## 🚀 Visão Geral

**PizzaFlow** é uma aplicação SaaS de delivery de pizza construída com tecnologias web modernas e sem dependência de frameworks UI. O projeto é mobile-first, instalável como PWA e pronto para crescer até um sistema completo para pizzarias.

---

## 🛠 Stack Tecnológica

| Tecnologia | Versão | Propósito |
|---|---|---|
| **Vite** | ^5.2 | Build tool & Dev Server |
| **HTML5** | — | Estrutura semântica |
| **CSS3** | — | Design System completo |
| **JavaScript ES Modules** | ES2022+ | Lógica da aplicação |
| **PWA** | — | Instalável & Offline |

> ❌ **Sem** React, Vue, Angular ou Bootstrap.

---

## 📁 Estrutura do Projeto

```
frontend/
├── public/
│   ├── icons/          → Ícones PWA (192, 512, maskable)
│   ├── images/         → Imagens dos produtos e banners
│   └── sw.js           → Service Worker
│
├── src/
│   ├── css/
│   │   ├── design-system.css   → Tokens, Reset, Tipografia
│   │   ├── animations.css      → Keyframes, Skeleton, Ripple
│   │   ├── components.css      → Todos os componentes UI
│   │   └── layout.css          → Grid, Responsividade
│   │
│   └── js/
│       ├── components/         → Componentes reutilizáveis
│       │   ├── Header.js
│       │   ├── Banner.js
│       │   ├── CategoryNav.js
│       │   ├── ProductCard.js
│       │   ├── FloatingCart.js
│       │   ├── BottomNav.js
│       │   ├── Toast.js
│       │   ├── Dialog.js
│       │   ├── SkeletonLoader.js
│       │   └── SearchBar.js
│       │
│       ├── pages/              → Páginas da aplicação
│       │   ├── HomePage.js
│       │   ├── CartPage.js
│       │   ├── ProductPage.js
│       │   └── OrderPage.js
│       │
│       ├── services/           → Camada de serviços
│       │   ├── api.js          → API REST / Mock
│       │   └── pwa.js          → PWA Service
│       │
│       ├── store/
│       │   └── store.js        → State Management (Observer)
│       │
│       ├── router/
│       │   └── router.js       → SPA Router (hash-based)
│       │
│       ├── utils/
│       │   ├── helpers.js      → DOM, debounce, storage...
│       │   └── formatters.js   → Currency, date, text...
│       │
│       └── data/
│           └── mockData.js     → Dados mock (produtos, banners...)
│
├── index.html
├── manifest.webmanifest
├── vite.config.js
└── package.json
```

---

## ⚡ Início Rápido

### Pré-requisitos
- **Node.js** ≥ 18
- **npm** ≥ 9

### Instalação e execução

```bash
# Clona o repositório (ou acesse a pasta)
cd frontend

# Instala dependências
npm install

# Inicia o servidor de desenvolvimento
npm run dev
```

O app estará disponível em: **http://localhost:3000**

### Build de produção

```bash
npm run build
npm run preview
```

---

## 🎨 Design System

### Paleta de Cores

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#E53935` | CTAs, brand |
| `--color-secondary` | `#FFC107` | Highlights, badges |
| `--color-bg` | `#111111` | Background principal |
| `--color-surface` | `#1A1A1A` | Cards, modais |
| `--color-surface-light` | `#252525` | Inputs, sub-surfaces |
| `--color-border` | `#303030` | Bordas |
| `--color-text-primary` | `#FFFFFF` | Texto principal |
| `--color-text-secondary` | `#B5B5B5` | Texto secundário |
| `--color-success` | `#43A047` | Status de sucesso |

### Tipografia
- **Poppins** — Títulos, labels, botões
- **Inter** — Corpo de texto

### Border Radius
`4px • 8px • 12px • 18px • 24px • 32px • 9999px`

---

## 📱 Funcionalidades

### Home Page
- ✅ Header com logo, endereço e tempo estimado
- ✅ Banner carrossel deslizante (swipe + autoplay)
- ✅ Navegação por categorias (scroll horizontal)
- ✅ Seção de promoções
- ✅ Mais Vendidas (scroll horizontal)
- ✅ Recomendadas (grid 2 colunas)
- ✅ Complete seu pedido (upsell)
- ✅ Carrinho flutuante
- ✅ Bottom Navigation

### Produto
- ✅ Imagem hero
- ✅ Seleção de tamanho (P, M, G)
- ✅ Controle de quantidade
- ✅ Ingredientes como chips
- ✅ Rating e avaliações
- ✅ Add to cart

### Carrinho
- ✅ Lista de itens com controles
- ✅ Resumo do pedido
- ✅ Campo de observações
- ✅ Campo de cupom
- ✅ Botão de checkout
- ✅ Estado vazio com CTA

### Pedidos
- ✅ Histórico de pedidos
- ✅ Status dos pedidos
- ✅ Estado vazio com onboarding

### PWA
- ✅ Web App Manifest
- ✅ Service Worker (cache estratégico)
- ✅ Prompt de instalação customizado
- ✅ Detecção offline
- ✅ Notificação de atualização

### Animações
- ✅ Fade, Slide, Scale keyframes
- ✅ Skeleton loading (shimmer)
- ✅ Ripple effect em botões
- ✅ Hover effects (lift, scale, glow)
- ✅ Transições de página

---

## 🏗 Arquitetura

### State Management
Pattern Observer simples sem dependências externas:
```javascript
store.subscribe('cart', (newCart) => { ... });
store.dispatch('ADD_TO_CART', product);
```

### Roteamento
SPA Router baseado em hash (`#home`, `#cart`, `#product`, `#orders`):
```javascript
navigate('#cart');
navigateToProduct('p001');
```

### Componentização
Função factory que retorna `{ build, destroy }`:
```javascript
const card = ProductCard(product);
const el = card.build(); // retorna HTMLElement
container.appendChild(el);
```

### API Layer
Pronto para integração com backend real via variável de ambiente:
```env
VITE_API_URL=https://api.pizzaflow.com.br
```

---

## 🔌 Integração com Backend

O arquivo `src/js/services/api.js` já está preparado:

1. Defina `VITE_API_URL` no `.env`
2. A flag `USE_MOCK` se torna `false` automaticamente
3. Todas as chamadas são redirecionadas para a API real

Endpoints esperados:
```
GET  /api/products
GET  /api/products/:id
GET  /api/products?category=pizza-classica
GET  /api/products/search?q=margherita
GET  /api/categories
GET  /api/banners
GET  /api/promotions
POST /api/orders
GET  /api/orders
```

---

## 📊 Performance

- **Code Splitting**: páginas carregadas sob demanda (dynamic import)
- **Lazy Images**: imagens carregadas conforme aparecem na viewport
- **CSS Variables**: sistema de design com variáveis nativas
- **Service Worker**: assets em cache, funciona offline
- **No-framework**: bundle mínimo, zero overhead de framework

---

## 🧪 Desenvolvimento

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:
```env
VITE_API_URL=               # URL da API (vazio = usa mock)
VITE_APP_NAME=PizzaFlow
```

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (localhost:3000)
npm run build    # Build de produção em /dist
npm run preview  # Preview do build de produção
```

---

## 🗺 Roadmap (SaaS)

### Fase 2 — Multi-tenant
- [ ] Autenticação (JWT)
- [ ] Dashboard da pizzaria
- [ ] Gestão de cardápio
- [ ] Gestão de pedidos em tempo real

### Fase 3 — Avançado
- [ ] Tracking de entrega em tempo real
- [ ] Sistema de pagamento (Stripe/Pix)
- [ ] Notificações push
- [ ] Analytics e relatórios
- [ ] App nativo (Capacitor.js)

---

## 📄 Licença

MIT © 2026 PizzaFlow

---

<p align="center">
  Feito com ❤️ e muito 🍕
</p>
