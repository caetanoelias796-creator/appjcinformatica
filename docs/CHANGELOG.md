# Histórico de Alterações (Changelog) — PizzaFlow

Todos os marcos e atualizações relevantes de engenharia de software do PizzaFlow estão catalogados neste documento de forma cronológica, seguindo o padrão de versionamento semântico.

---

## [0.5.0] — 2026-07-06
### 🏢 Domínio da Pizzaria (Company Domain)
Esta versão consolidou as regras operacionais da empresa, separando o estado estático da pizzaria de interações mutáveis e criando bases sólidas para suporte multiloja (multi-tenant) na Fase 2.

#### Adicionado
* Acoplamento de metadados da pizzaria (nome, endereço físico, horário de funcionamento e status operacional) na store principal em `AppStore.js`.
* Sistema de verificação de funcionamento (Aberto/Fechado) com bloqueio condicional de checkout.
* Regras dinâmicas para flutuação do tempo de entrega com base na carga da fila de preparação de pizzas.

---

## [0.4.0] — 2026-06-25
### 📦 Domínio do Pedido e Máquinas de Estados (Order Domain)
Foco na confiabilidade e imutabilidade dos pedidos realizados. Introduziu a modelagem rica de transações de checkout e proteções contra estados inconsistentes.

#### Adicionado
* Camada de domínio de pedidos em `src/domain/order/` contendo:
  * `Order.js`: Entidade agregadora imutável com número serial único.
  * `OrderItem.js`: Snapshot estruturado dos produtos comprados contendo preço final de venda travado.
  * `OrderStatus.js`: Máquina de estados finita limitando transições inválidas (ex: impossível mover um pedido de "pendente" direto para "entregue").
* `OrderFactory.js`: Fábrica dedicada que realiza o mapeamento seguro da entidade mutável `Cart` para a entidade imutável `Order`.
* `OrderValidator.js`: Validador estrito que barra pedidos sem dados mínimos obrigatórios de contato ou endereço.

---

## [0.3.0] — 2026-05-10
### 🛒 Domínio do Carrinho & Persistência (Smart Cart)
Introdução da camada reativa inteligente do carrinho de compras do PizzaFlow, acoplando persistência transparente ao domínio de negócio.

#### Adicionado
* Implementação do domínio rico sob `src/domain/cart/`:
  * `Cart.js`: Agregado que escuta e notifica mudanças através de um encapsulamento reativo.
  * `CartItem.js`: Entidade que representa a pizza montada e precificada no carrinho.
  * `Coupon.js`: Motor de desconto percentual e fixo.
  * `Shipping.js`: Lógica de custos de despacho físico.
* `StorageService.js`: Serviço de persistência local abstrato (`localStorage`).
* Padrão auto-save: Qualquer inserção ou mudança de quantidade no carrinho dispara um salvamento em background e publica o estado consolidado no `EventBus` (`cart:update`).
* Boot de recuperação: Ao iniciar a aplicação, se o carrinho persistido localmente tiver menos de 24 horas de existência, a sessão de compra é restaurada de forma transparente para o usuário.

---

## [0.2.0] — 2026-04-02
### 🍕 Modal de Produto e Integração Core-UI (Product Builder)
Primeira grande ponte ligando os componentes visuais ao motor lógico interno. Permitiu a personalização gráfica interativa da pizza meio-a-meio e opcionais.

#### Adicionado
* Componente `ProductModal.js` e seus seletores integrados de tamanho, sabores e bordas.
* Injeção gráfica dinâmica da pizza dividida em `PizzaPreview.js`.
* Acoplamento reativo com `EventBus` através do canal `product:updated`.
* Implementação dos métodos de limpeza (`destroy()`) em componentes visuais para anular event listeners do DOM e registros do barramento, corrigindo vazamentos de memória na troca de telas.

---

## [0.1.0] — 2026-02-15
### 🟢 Estrutura Core e Fundações (Core)
Definição dos alicerces de design de software e infraestrutura de desenvolvimento do PizzaFlow.

#### Adicionado
* Configuração inicial do bundler **Vite** e estrutura geral de pastas do projeto.
* Implementação do **`EventBus.js`** (Publish/Subscribe centralizado).
* Criação do **`PriceEngine.js`** isolado (aplicando a regra de cobrança pelo sabor de maior valor em pizzas fracionadas).
* Padrão fluente **`ProductBuilder.js`** para acumular estados temporários de customização do produto de forma sequencial.
* Criação do **`PizzaRules.js`** com os limites operacionais (limitação de sabores por diâmetro e validação de elegibilidade de borda).
