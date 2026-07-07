# PizzaFlow — Manual do Desenvolvedor & Documentação Geral

Seja bem-vindo à documentação técnica oficial do **PizzaFlow**! O PizzaFlow é um Progressive Web App (PWA) moderno, mobile-first, otimizado para autoatendimento e customização interativa de pizzas em tempo real.

Este guia fornece as diretrizes fundamentais para configurar, executar, compilar e compreender a arquitetura geral do ecossistema.

---

## 🎯 Objetivo do Projeto

O principal objetivo do PizzaFlow é oferecer uma experiência de compra ágil de pizzas, similar a aplicativos nativos instaláveis, com foco em performance pura. O projeto destaca-se por:
1. **Configuração Interativa de Pizzas**: Divisão meio-a-meio (até 4 sabores dependendo do tamanho), seleção de bordas e adicionais com recalculo financeiro instantâneo.
2. **Desacoplamento por Eventos (EDA)**: Toda a sincronização entre a interface visual e o motor lógico de negócios ocorre de forma assíncrona e isolada.
3. **Persistência de Sessão Inteligente**: O carrinho do usuário é salvo de forma transparente e recuperado no boot da aplicação caso tenha menos de 24 horas.

---

## 💻 Tecnologias Utilizadas

A stack tecnológica do PizzaFlow foi escolhida focando em carregamento bruto instantâneo e portabilidade:
* **Bundler & Dev Server**: [Vite](https://vite.dev/) (Compilação baseada em ESbuild).
* **Linguagem**: JavaScript Moderno (ES2022+) utilizando estritamente **ES Modules**.
* **Interface**: HTML5 Semântico e CSS3 Vanilla (Utilizando variáveis nativas CSS e design system modular).
* **Capacidades Offline (PWA)**: Registros de Service Worker para cache local estratégico e manifesto instalável.
* **Persistência**: `LocalStorage` mediado através de serviços utilitários.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Ter o [Node.js](https://nodejs.org/) instalado (versão 18 ou superior recomendada).

### Passo 1: Instalar Dependências
Navegue até a pasta do frontend e instale as dependências:
```bash
cd frontend
npm install
```

### Passo 2: Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O console exibirá a URL local (ex: `http://localhost:3000`). Abra esta URL no navegador para desenvolvimento em tempo real com Hot Module Replacement (HMR).

---

## 🏗️ Como Gerar o Build de Produção

Para gerar a build de produção otimizada, minificada e com divisão de código (code-splitting):
```bash
npm run build
```
Esse comando compila os arquivos e gera o diretório `/dist` pronto para implantação em servidores de arquivos estáticos. Para testar o comportamento de produção localmente:
```bash
npm run preview
```

---

## 📂 Estrutura de Diretórios

A organização física dos arquivos do PizzaFlow segue o padrão abaixo:
```
src/
├── core/                  # Regras de Negócio Globais e barramento de eventos (RFC-001)
│   ├── EventBus.js        # Barramento Publish/Subscribe centralizado
│   ├── ProductBuilder.js  # Padrão Builder para customização de produtos
│   ├── PizzaRules.js      # Validador de regras de negócio de pizzas
│   ├── PriceEngine.js     # Motor central de cálculo financeiro
│   ├── CartStore.js       # Store de integração do carrinho
│   └── AppStore.js        # Estado global simplificado
├── domain/                # Modelos e Entidades de Domínio Rico (RFC-003/004)
│   ├── cart/              # Domínio do Carrinho (Cart, CartItem, Coupon, Shipping, Summary)
│   └── order/             # Domínio do Pedido (Order, OrderItem, OrderStatus, OrderSummary, etc.)
├── css/                   # Estilos globais e tokens de design (cores, tipografia, layout)
└── js/                    # Camada de Apresentação e Serviços do App
    ├── components/        # Componentes de UI encapsulados (Header, Banner, Toast)
    │   ├── cart/          # Componentes visuais do Carrinho (CartDrawer, CartItemCard, etc.)
    │   └── product/       # Componentes visuais do Modal de Produto (ProductModal, PizzaPreview, etc.)
    ├── pages/             # Telas completas da SPA carregadas pelo Router
    ├── router/            # Roteador simples baseado em URL Hash
    ├── store/             # Stores legadas e de estado de UI
    ├── services/          # Conexões de API externa (api.js) e PWA (pwa.js)
    └── utils/             # Formatadores (formatters.js) e auxiliares de DOM (helpers.js)
```

---

## 📐 Convenções Gerais do Projeto
* **Imports Relativos**: Utilize os aliases configurados no Vite para simplificar caminhos (ex: `@/core/...` mapeia para `src/core/`).
* **Nomenclatura**:
  * `PascalCase` para componentes visuais, páginas e classes (ex: `ProductModal.js`, `CartItem.js`).
  * `camelCase` para métodos, variáveis e arquivos utilitários/serviços (ex: `calculateDiscount()`, `formatters.js`).
  * `kebab-case` para diretórios gerais e estilos CSS (ex: `src/domain/cart/`, `product-modal.css`).

---

## 📖 Guias e Documentações Adicionais

Para aprofundar-se no desenvolvimento do PizzaFlow, consulte os seguintes documentos:
* **[Arquitetura do Projeto](./ARCHITECTURE.md)**: Detalhamento macro das camadas e responsabilidade das pastas.
* **[Catálogo de Domínios](./DOMAINS.md)**: Mapeamento dos Bounded Contexts e lógica rica de entidades de negócio.
* **[Catálogo de Componentes UI](./COMPONENTS.md)**: Detalhes visuais, propriedades e ciclo de vida de cada componente.
* **[Catálogo de Eventos](./EVENTS.md)**: Descrição detalhada dos canais de pub/sub e payloads JSON.
* **[Guia de Contribuição](./CONTRIBUTING.md)**: Regras estritas de design arquitetural e regras proibidas para desenvolvedores.
* **[Padrões de Código](./CODING_STANDARDS.md)**: Diretrizes de Clean Code, JSDoc e estilo de sintaxe do JavaScript.
* **[Roadmap do Produto](./ROADMAP.md)**: Linha do tempo das metas de liberação de versões.
* **[Histórico de Alterações (Changelog)](./CHANGELOG.md)**: Registro histórico das conquistas implementadas de 0.1 a 0.5.
