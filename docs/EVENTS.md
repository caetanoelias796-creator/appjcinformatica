# Catálogo de Eventos (EventBus) — PizzaFlow

O PizzaFlow baseia-se em uma **Arquitetura Orientada a Eventos (EDA)**. A comunicação e a reatividade entre os componentes de interface (UI) e as regras lógicas de negócio ocorrem por meio do barramento centralizado `EventBus.js`.

Abaixo estão descritos todos os eventos suportados pelo barramento, seus emissores, receptores e payloads correspondentes.

---

## 🛒 1. Eventos do Carrinho (`cart:`)

### `cart:add`
* **Descrição**: Disparado logo após o cliente adicionar com sucesso um item configurado ao carrinho.
* **Emissor**: `CartStore.js` / `Cart.js`.
* **Receptores**: Componentes de feedback (como `Toast.js` para exibir mensagem de confirmação) e gatilhos de animação de itens.
* **Payload**:
  ```json
  {
    "id": "mussarela-grande-borda-catupiry",
    "productId": "mussarela",
    "productName": "Pizza Mussarela",
    "size": { "id": "grande", "label": "Grande", "price": 115 },
    "flavors": [{ "id": "mussarela", "name": "Mussarela" }],
    "crust": { "id": "catupiry", "name": "Catupiry", "price": 10 },
    "extras": [],
    "observation": "Sem cebola",
    "quantity": 1,
    "unitPrice": 125,
    "totalPrice": 125,
    "image": "/assets/pizza_hero.png"
  }
  ```

### `cart:update`
* **Descrição**: Notifica que o estado consolidado do carrinho de compras sofreu modificações (mudança de quantidade, adição/remoção de itens, aplicação de cupom ou alteração do método de frete).
* **Emissor**: `Cart.js` (após cada alteração persistida).
* **Receptores**: `CartDrawer.js`, `FloatingCart.js`, `BottomNav.js`, `CartPage.js`.
* **Payload**:
  ```json
  {
    "items": [...], // Array de objetos CartItem ativos no carrinho
    "count": 2, // Quantidade agregada de itens
    "subtotal": 210.00, // Soma bruta de produtos
    "extras": 15.00, // Valor de adicionais e bordas recheadas
    "discount": 20.00, // Desconto subtraído por cupons aplicados
    "shipping": 8.00, // Custo de entrega
    "total": 213.00 // Total líquido da transação
  }
  ```

### `cart:remove`
* **Descrição**: Emitido no momento em que um item de configuração específica é deletado do carrinho.
* **Emissor**: `Cart.js`.
* **Payload**: O ID de identificação única do item removido (`cartItemId`, string).

### `cart:clear`
* **Descrição**: Notifica o esvaziamento total do carrinho de compras.
* **Emissor**: `Cart.js`.
* **Receptores**: `CartDrawer.js` (para remontar o estado de gaveta vazia).
* **Payload**: `null`

### `cart:restore`
* **Descrição**: Emitido no momento da inicialização da aplicação, caso exista uma sessão de carrinho válida restaurada do `localStorage`.
* **Emissor**: `Cart.js`.
* **Payload**: Array de itens (`CartItem[]`) restaurados na sessão.

### `cart:request_update`
* **Descrição**: Evento de chamada assíncrona. Um componente recém-montado publica este sinal solicitando que o domínio reenvie o estado atual do carrinho.
* **Emissor**: Qualquer componente UI em fase de carregamento (ex: `FloatingCart.js`).
* **Receptores**: `Cart.js` (responde imediatamente publicando o estado ativo em `cart:update`).
* **Payload**: `null`

---

## 🍕 2. Eventos de Customização de Produto (`product:`)

### `product:open`
* **Descrição**: Disparado para abrir o modal de customização de um produto específico (pizza ou outro item do cardápio).
* **Emissor**: `ProductCard.js` ou controladores de página.
* **Receptores**: `ProductModal.js` (que intercepta o sinal e inicia o seu ciclo de exibição).
* **Payload**:
  ```json
  {
    "productId": "calabresa",
    "mode": "create" // ou "edit" para modificar um item já existente no carrinho
  }
  ```

### `product:updated`
* **Descrição**: Disparado pelo modal a cada interação do cliente com os controles de personalização da pizza para atualizar visualmente o preço e a pré-visualização.
* **Emissor**: `ProductModal.js`.
* **Receptores**: `PizzaPreview.js`, `PriceSummary.js`, `QuantitySelector.js`.
* **Payload**:
  ```json
  {
    "config": {
      "productId": "calabresa",
      "size": "grande",
      "flavors": ["calabresa", "mussarela"],
      "crust": "catupiry",
      "extras": ["bacon"],
      "quantity": 1
    },
    "pricing": {
      "basePrice": 115.00,
      "extrasPrice": 15.00,
      "totalPrice": 130.00
    }
  }
  ```

### `product:close`
* **Descrição**: Sinaliza o fechamento e a destruição dos elementos DOM da modal de produtos.
* **Emissor**: `ProductModal.js`.
* **Receptores**: Controladores de visualização de tela geral.
* **Payload**: `null`

---

## 🏢 3. Eventos Operacionais da Pizzaria (`company:`)

### `company:update`
* **Descrição**: Notifica os componentes visuais sobre alterações nas definições e status operacionais do restaurante (ex: horário especial de feriado, fechamento antecipado ou flutuação de filas).
* **Emissor**: `AppStore.js` / Servidor backend.
* **Receptores**: `Header.js`, `CartDrawer.js` (para travar ações de checkout).
* **Payload**:
  ```json
  {
    "isOpen": false,
    "estimatedTime": "60–80 min",
    "deliveryTaxRate": 12.00
  }
  ```

---

## 📦 4. Eventos do Ciclo de Pedido (`order:`)

### `order:create`
* **Descrição**: Disparado quando um pedido de compras é validado e consolidado com sucesso no checkout.
* **Emissor**: `OrderFactory.js`.
* **Receptores**: `AppStore.js` (para esvaziar o carrinho) e roteadores de páginas (para encaminhar à tela de acompanhamento).
* **Payload**:
  ```json
  {
    "orderId": "ORD-2026-98741",
    "items": [...],
    "totals": {
      "subtotal": 125.00,
      "shipping": 8.00,
      "total": 133.00
    },
    "paymentMethod": "PIX",
    "address": "Av. Principal, 100 - Centro",
    "status": "pending",
    "createdAt": "2026-07-06T14:02:11Z"
  }
  ```

### `order:update`
* **Descrição**: Emitido caso haja alguma alteração estrutural no pedido ativo (como adição de observações do motoboy ou vinculação de entregador).
* **Emissor**: Backend API Service.
* **Payload**: O objeto `Order` completo com os dados atualizados.

### `order:status`
* **Descrição**: Disparado quando a cozinha ou a equipe de entrega atualiza a etapa do ciclo de vida físico do pedido.
* **Emissor**: `Order.js` ou canal de sincronização externa (WebSocket).
* **Receptores**: Telas de acompanhamento (`OrderPage.js`) e notificações push.
* **Payload**:
  ```json
  {
    "orderId": "ORD-2026-98741",
    "previousStatus": "preparing",
    "currentStatus": "ready",
    "updatedAt": "2026-07-06T14:15:30Z"
  }
  ```
