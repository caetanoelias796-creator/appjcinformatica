# Plano de Desenvolvimento (Roadmap) — PizzaFlow

Este documento descreve o plano de lançamentos e evolução de engenharia de software do **PizzaFlow**, detalhando os marcos concluídos e os objetivos futuros para a consolidação do sistema como um SaaS (Software as a Service) robusto para pizzarias.

---

## 🗺️ Linha do Tempo e Metas de Versão

### 🟢 Versão 0.1 — Fundações e Estrutura Core (Concluído)
Foco nos pilares de arquitetura e desacoplamento inicial do sistema.
* [x] Configuração inicial do bundler Vite para carregamento rápido (ES Modules).
* [x] Implementação do barramento central de comunicação Pub/Sub em `EventBus.js`.
* [x] Criação do motor puro de preços `PriceEngine.js`.
* [x] Desenvolvimento da interface fluente de customização `ProductBuilder.js`.
* [x] Implementação do dicionário de regras de negócio de pizzas em `PizzaRules.js`.

### 🟢 Versão 0.2 — Modal de Produto e Integração Core-UI (Concluído)
Implementação de pontes reativas entre a interface visual e os motores analíticos internos.
* [x] Criação do componente `ProductModal.js` para visualização e customização.
* [x] Renderização de fatias de pizza personalizadas em tempo real via `PizzaPreview.js`.
* [x] Acoplamento de componentes da modal ao barramento via canal `product:updated`.
* [x] Implementação de ciclo de vida explícito com métodos `destroy()` para anulação de escutas no DOM e EventBus, prevenindo vazamentos de memória.

### 🟢 Versão 0.3 — Domínio do Carrinho & Persistência (Concluído)
Introdução de lógica rica encapsulada e salvamento transparente de sessões de compras.
* [x] Criação da pasta de domínio de carrinho `src/domain/cart/` (`Cart`, `CartItem`, `Summary`).
* [x] Abstração de regras de cupons (`Coupon.js`) e custos de frete (`Shipping.js`).
* [x] Integração do serviço de persistência local `StorageService.js`.
* [x] Mecanismo de reidratação reativa do carrinho a partir de sessões locais de até 24 horas.
* [x] Atualização síncrona de contadores no `FloatingCart` e `BottomNav` baseado no evento `cart:update`.

### 🟢 Versão 0.4 — Domínio do Pedido e Máquina de Estados (Concluído)
Modelagem e validação do fluxo transacional pós-carrinho.
* [x] Criação do domínio de pedidos em `src/domain/order/` (`Order`, `OrderItem`).
* [x] Criação da máquina de transições lógicas em `OrderStatus.js`.
* [x] Desenvolvimento do validador transacional em `OrderValidator.js`.
* [x] Criação do mapeador transacional `OrderFactory.js`.

### 🟢 Versão 0.5 — Domínio da Pizzaria (Concluído)
Consolidação de configurações de negócio corporativas na store principal.
* [x] Acoplamento de metadados operacionais da pizzaria em `AppStore.js`.
* [x] Controle reativo de status operacional (Aberto/Fechado) impedindo checkouts indevidos.
* [x] Flutuação automática de estimativa de tempo de entrega baseada no fluxo de pedidos ativos.

---

### 🟡 Versão 1.0 — Integração Visual do Carrinho & Checkout (Próximo Passo)
Consolidar a experiência de ponta a ponta do comprador sem acoplamento a servidores.
* [ ] Desenvolvimento visual completo do `CartDrawer.js` para manipulação de quantidades do carrinho em tempo real.
* [ ] Criação da tela de Checkout contendo integração visual direta com as entidades `Coupon` e `Shipping`.
* [ ] Validação de formulários de entrega no `AddressModal` integrado ao `OrderValidator`.
* [ ] Sistema visual reativo para exibição de transição de status do pedido ativo.

---

### 🔵 Versão 1.5 — Integração com APIs e Autenticação (Planejado)
Migrar a infraestrutura do app para conexões com servidores backend em nuvem.
* [ ] Implementação de chamadas REST/GraphQL reais no `api.js` para sincronizar o carrinho de compras no banco de dados.
* [ ] Integração com gateway de pagamentos online (Geração de Pix dinâmico e validação de cartão).
* [ ] Autenticação do cliente utilizando tokens JWT (JSON Web Tokens).
* [ ] Implementação de WebSockets no `EventBus` para receber atualizações de status da cozinha em tempo real.

---

### 🔵 Versão 2.0 — Painel Administrativo & Gestão de Cozinha (Planejado)
Profissionalização do ecossistema PizzaFlow fornecendo a interface administrativa multi-tenant.
* [ ] Criação de painel de controle (dashboard) do restaurante para gerenciar cardápio e faturamento.
* [ ] Desenvolvimento da tela de monitoramento de produção da cozinha (KDS - Kitchen Display System).
* [ ] Integração de notificações por Push nativas via Service Worker para avisar o cliente final sobre a saída da pizza.
* [ ] Geração de aplicativos nativos mobile utilizando Capacitor.js a partir da mesma base de código frontend.
