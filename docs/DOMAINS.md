# Domínios de Negócio (Bounded Contexts) — PizzaFlow

O PizzaFlow é projetado com base nos princípios de **Domain-Driven Design (DDD)**. O sistema é dividido em diferentes contextos delimitados (Bounded Contexts), cada um com suas próprias entidades, regras de negócio e responsabilidades.

Abaixo está o detalhamento técnico e conceitual de cada domínio do ecossistema PizzaFlow.

---

## 🛒 1. Cart (Carrinho)
O domínio do Carrinho gerencia a intenção de compra do cliente. Ele agrega as seleções de produtos personalizadas, valida cupons de desconto, calcula fretes temporários e gera a base para o fechamento do pedido.

* **Status de Implementação**: 🟢 Concluído (Fase 1/2)
* **Localização**: `src/domain/cart/`
* **Principais Entidades & Objetos de Valor**:
  * **`Cart` (Entidade Raiz de Agregado)**: Controla a lista de itens, adiciona/remove produtos, aplica cupons e delega persistência.
  * **`CartItem` (Entidade)**: Representa um produto customizado com tamanho, borda, sabores divididos (meio a meio) e adicionais.
  * **`Coupon` (Objeto de Valor)**: Representa um código de desconto com regras de expiração e valor mínimo.
  * **`Shipping` (Objeto de Valor)**: Calcula a taxa de entrega baseando-se no endereço e método de envio selecionado.
  * **`Summary` (Objeto de Valor)**: Consolida os cálculos financeiros do carrinho (subtotal, taxas, descontos e total).
* **Regras de Negócio**:
  * O preço total não pode ser negativo.
  * Um cupom de desconto só pode ser aplicado se o subtotal atingir o valor mínimo exigido pelo cupom.
  * A alteração de qualquer item (quantidade ou exclusão) invalida e recalcula automaticamente o `Summary`.

---

## 📦 2. Order (Pedido)
Responsável pelo processamento e acompanhamento das compras que foram consolidadas. O domínio do Pedido encapsula o ciclo de vida da transação após o checkout.

* **Status de Implementação**: 🟢 Concluído (Fase 1/2)
* **Localização**: `src/domain/order/`
* **Principais Entidades & Objetos de Valor**:
  * **`Order` (Entidade Raiz de Agregado)**: Rastreia a identificação única do pedido, itens comprados, valores fechados e status atual.
  * **`OrderItem` (Objeto de Valor)**: Snapshot imutável de um item de carrinho convertido em pedido.
  * **`OrderStatus` (Objeto de Valor / Máquina de Estados)**: Controla as transições permitidas no fluxo do pedido.
  * **`OrderValidator` (Domain Service)**: Validador de pré-requisitos para criação do pedido.
  * **`OrderFactory` (Factory)**: Transforma a entidade reativa `Cart` em uma nova entidade `Order` imutável.
* **Regras de Negócio**:
  * Um pedido não pode ser modificado após sua criação (imutabilidade).
  * O status do pedido só pode seguir a sequência lógica definida em `OrderStatus`: `pending` ➔ `confirmed` ➔ `preparing` ➔ `ready` ➔ `dispatched` ➔ `delivered` (ou `cancelled`).
  * Não é permitido criar um pedido sem endereço de entrega configurado caso o método de envio selecionado seja "Delivery".

---

## 🍕 3. Product (Produto & Cardápio)
Representa o catálogo de itens comercializados pela pizzaria e as regras de customização dinâmica (combinação de sabores, tamanhos, tipos de massas, bordas e ingredientes extras).

* **Status de Implementação**: 🟢 Concluído (Lógica no Core / Estrutura no Mock)
* **Localização**: `src/core/PizzaRules.js`, `src/core/ProductBuilder.js` e `src/js/data/mockData.js`
* **Principais Conceitos**:
  * **`Product`**: Item básico do catálogo (pizza clássica, refrigerante, doce, etc.).
  * **`PizzaConfiguration`**: Estrutura dinâmica que descreve uma pizza montada (sabores escolhidos, tamanho, borda e opcionais).
* **Regras de Negócio**:
  * **Limite de Sabores por Tamanho**:
    * Tamanho *Broto*: Apenas 1 sabor.
    * Tamanho *Médio*: Até 2 sabores.
    * Tamanho *Grande*: Até 3 sabores.
    * Tamanho *Família (Trem)*: Até 4 sabores.
  * **Borda Recheada**: Só é elegível para pizzas de tamanho Médio, Grande ou Família.
  * **Preço Meio-a-Meio**: O valor da pizza combinada é calculado com base no valor da pizza de sabor mais caro do mix (regra configurável via `PriceEngine.js`).

---

## 🏢 4. Company (Pizzaria / Tenant)
Encapsula as configurações corporativas e operacionais da pizzaria. Define se o delivery está aberto, taxas bases, tempo médio de espera e identidade da loja.

* **Status de Implementação**: 🟡 Parcial (Configuração estática em `AppStore.js` / mockData)
* **Regras de Negócio**:
  * O sistema não deve aceitar novos pedidos se a empresa estiver com o status "Closed" (fechada).
  * O tempo estimado de entrega flutua de acordo com o volume de pedidos ativos na cozinha.

---

## 👤 5. Customer (Cliente)
Representa o comprador. Contém seus dados de identificação, credenciais de acesso, histórico de compras e catálogo de endereços salvos.

* **Status de Implementação**: 🟡 Parcial (Dados de endereço salvos localmente em `AppStore` / `localStorage`)
* **Regras de Negócio**:
  * O cliente deve ter pelo menos um endereço principal ativo para efetuar pedidos do tipo "Delivery".
  * O histórico de pedidos é privado e associado ao identificador do cliente.

---

## 💳 6. Payment (Pagamento)
Gerencia as transações financeiras e métodos de pagamento suportados pela pizzaria (cartão de crédito online, Pix dinâmico, dinheiro ou maquininha física na entrega).

* **Status de Implementação**: 🔵 Planejado (Fase 1.5)
* **Regras de Negócio**:
  * Pedidos online (Pix ou Cartão Web) só avançam para o status `confirmed` na cozinha após a confirmação da transação (via webhook do gateway).
  * Pedidos com pagamento em dinheiro devem especificar se necessitam de troco e para qual valor.

---

## 🍳 7. Kitchen (Cozinha / Produção)
Gerencia a linha de montagem e produção de alimentos. É o sistema que dita o fluxo de preparação do pedido físico (abertura de massa, aplicação de ingredientes, forno, controle de temperatura e embalagem).

* **Status de Implementação**: 🔵 Planejado (Fase 2.0)
* **Regras de Negócio**:
  * Pedidos são organizados por fila de prioridade cronológica e complexidade de montagem.
  * O painel da cozinha avança os status do pedido (`confirmed` ➔ `preparing` ➔ `ready`), que notificam em tempo real o cliente via EventBus (WebSockets).

---

## 🛵 8. Delivery (Entrega)
Gerencia a logística de distribuição física dos pedidos. Abrange a roteirização de entregas, atribuição de pedidos aos motoboys e o rastreamento geográfico em tempo real.

* **Status de Implementação**: 🔵 Planejado (Fase 1.5 - Rastreamento básico / Fase 2.0 - Logística avançada)
* **Regras de Negócio**:
  * Um motoboy pode agrupar até 3 pedidos da mesma rota geográfica para otimização de custo de entrega.
  * O status do pedido muda para `dispatched` no momento da saída do entregador e `delivered` mediante assinatura/confirmação digital.
