# Catálogo de Componentes de Interface (UI) — PizzaFlow

O PizzaFlow adota uma arquitetura de componentização modular baseada em **JavaScript Vanilla Puro** (sem frameworks) com injeção reativa via barramento de eventos.

Todos os componentes visuais são implementados como **funções fábrica (factory pattern)** e residem sob o diretório `src/js/components/`. Eles seguem um ciclo de vida explícito composto por inicialização (`build()`) e desmontagem/limpeza (`destroy()`).

---

## 🏗️ Ciclo de Vida dos Componentes
Para evitar vazamentos de memória (memory leaks) e escutas de eventos duplicadas no DOM, todo componente dinâmico deve expor:
1. **`build()`**: Constrói o elemento HTML em memória, vincula escutas de eventos DOM (`addEventListener`) e se inscreve em canais do `EventBus`. Retorna um `HTMLElement` pronto para inserção no documento.
2. **`destroy()`**: Desvincula manipuladores de eventos e chama as funções de cancelamento de inscrição (`unsubscribe`) retornadas pelo `EventBus`.

---

## 🧩 Detalhamento dos Componentes

### 1. Header (Cabeçalho)
* **Objetivo**: Barra superior principal que exibe a identidade da pizzaria (logo), o endereço atual selecionado pelo cliente e o tempo de entrega estimado.
* **Arquivos**:
  * Código: `src/js/components/Header.js`
* **Interações & Eventos**:
  * Abre o `AddressModal` quando o usuário clica no seletor de endereço.
  * Consome o estado `user` do `store` para atualizar a exibição do endereço e o tempo estimado.
  * Escuta o evento `user` na store principal para re-renderizar as informações atualizadas.

---

### 2. Banner (Carrossel de Destaques)
* **Objetivo**: Apresenta banners promocionais e ofertas em destaque na página inicial através de um carrossel deslizante com suporte a toque (swipe/drag) e rotação automática.
* **Arquivos**:
  * Código: `src/js/components/Banner.js`
* **Interações & Eventos**:
  * Controla os slides via eventos DOM de toque (`touchstart`, `touchmove`, `touchend`) e mouse (`mousedown`, `mousemove`, `mouseup`).
  * Inicia um timer rotativo interno ao ser montado e limpa o timer (`clearInterval`) no método `destroy()`.

---

### 3. SearchBar (Barra de Pesquisa)
* **Objetivo**: Campo de busca posicionado na home page para permitir ao usuário filtrar produtos do cardápio em tempo real.
* **Arquivos**:
  * Código: `src/js/components/SearchBar.js`
* **Interações & Eventos**:
  * Captura a entrada do teclado (`input`) utilizando a técnica de **debounce** (atraso de 300ms) para evitar filtragens excessivas a cada caractere digitado.
  * Dispara a ação `SET_SEARCH` no `store` global.

---

### 4. CategoryNav (Navegação por Categorias)
* **Objetivo**: Menu de rolagem horizontal contendo botões representativos de cada categoria do cardápio (Pizzas Clássicas, Doces, Bebidas, Lanches, etc.) acompanhados por ícones emoji.
* **Arquivos**:
  * Código: `src/js/components/CategoryNav.js`
* **Interações & Eventos**:
  * Ao clicar em uma categoria, dispara a ação `SET_CATEGORY` no `store` global e aplica a classe CSS `.active` visualmente.
  * Escuta a alteração de categoria selecionada para manter o botão sincronizado.

---

### 5. ProductCard (Card de Produto)
* **Objetivo**: Renderiza as informações resumidas de um produto no grid principal do catálogo (imagem, título, classificação, preço inicial e botão de customização/compra).
* **Arquivos**:
  * Código: `src/js/components/ProductCard.js`
* **Interações & Eventos**:
  * Ao clicar no card, navega para a página do produto (`#product/:id`) ou abre o `ProductModal` para customização.
  * Utiliza carregamento preguiçoso de imagem (`loading="lazy"`) para otimizar o consumo de banda.

---

### 6. ProductModal (Modal de Customização de Pizza)
* **Objetivo**: O componente mais complexo do sistema. Fornece uma interface rica para o cliente configurar sua pizza: escolher múltiplos sabores (divisão meio-a-meio), alterar o tamanho, selecionar bordas recheadas, marcar ingredientes adicionais e ver o cálculo do preço mudar em tempo real.
* **Arquivos**:
  * Código: `src/js/components/product/ProductModal.js`
  * Estilo: `src/js/components/product/productModal.css`
* **Subcomponentes Filhos Acoplados**:
  * `PizzaPreview.js` (representação gráfica 3D/2D dos sabores selecionados).
  * `SizeSelector.js` (botões de rádio para tamanho da pizza).
  * `FlavorSelector.js` (listagem de sabores elegíveis com badges e contadores).
  * `CrustSelector.js` (seleção de bordas).
  * `ExtraSelector.js` (chips clicáveis de ingredientes adicionais).
  * `QuantitySelector.js` (controles de `+` e `-`).
  * `PriceSummary.js` (exibição de rodapé com o preço final).
* **Interações & Eventos**:
  * **Emite**: `product:updated` a cada interação do usuário para forçar o recalculo financeiro e re-renderizar os subcomponentes de preço.
  * **Emite**: `cart:add` ao clicar no botão "Adicionar ao Carrinho" (após validações em `PizzaRules`).
  * **Emite**: `modal:close` ao fechar.

---

### 7. FloatingCart (Carrinho Flutuante)
* **Objetivo**: Botão flutuante fixado no canto inferior direito que informa a quantidade de itens presentes no carrinho e o valor total acumulado. Fica visível apenas ao rolar a página inicial.
* **Arquivos**:
  * Código: `src/js/components/FloatingCart.js`
* **Interações & Eventos**:
  * **Escuta**: `cart:update` para alterar dinamicamente a contagem de itens e o total em dinheiro exposto no badge.
  * Ao ser clicado, abre o painel lateral do carrinho (`CartDrawer`).

---

### 8. BottomNav (Navegação Inferior Mobile-First)
* **Objetivo**: Barra de navegação inferior estilo aplicativo móvel nativo, com abas para Home/Cardápio, Carrinho e Histórico de Pedidos.
* **Arquivos**:
  * Código: `src/js/components/BottomNav.js`
* **Interações & Eventos**:
  * Escuta mudanças de rota (`onPageChange`) para alternar a classe `.active` nos ícones correspondentes.
  * **Escuta**: `cart:update` para renderizar um badge vermelho com o contador numérico sobre o ícone do carrinho.

---

### 9. CartDrawer (Painel Lateral do Carrinho)
* **Objetivo**: Menu gaveta (drawer) que desliza a partir da direita da tela contendo a listagem completa dos itens adicionados ao carrinho, resumo de valores (subtotal, frete, descontos e total), entrada de cupons promocionais e o botão para proceder ao Checkout.
* **Arquivos**:
  * Código: `src/js/components/cart/CartDrawer.js`
  * Estilo: `src/js/components/cart/cartDrawer.css`
* **Subcomponentes Filhos Acoplados**:
  * `CartItemCard.js` (linhas individuais dos produtos com opção de alterar quantidade ou remover).
  * `CouponInput.js` (campo de texto para cupom com feedback de sucesso/erro).
  * `ShippingCard.js` (opções de entrega versus retirada).
  * `CartSummary.js` (linhas detalhadas de taxas e descontos).
  * `EmptyCart.js` (ilustração exibida quando o carrinho não possui itens).
* **Interações & Eventos**:
  * **Escuta**: `cart:update` para remontar a listagem interna sempre que o carrinho for modificado.
  * **Dispara**: Chamadas diretas ao `CartStore` para manipular quantidades e remover cupons.

---

### 10. AddressModal (Modal de Seleção de Endereço)
* **Objetivo**: Diálogo interativo para o usuário buscar o seu CEP, selecionar o logradouro e salvar seu endereço de entrega.
* **Arquivos**:
  * Código: `src/js/components/AddressModal.js`
* **Interações & Eventos**:
  * Ao confirmar, dispara a ação `SET_ADDRESS` na store principal, salvando os dados e fechando o modal.

---

### 11. Toast (Mensagens Flutuantes de Feedback)
* **Objetivo**: Exibe pequenas notificações temporárias no topo da tela para confirmar ações do usuário (ex: "Cupom aplicado com sucesso", "Item adicionado ao carrinho").
* **Arquivos**:
  * Código: `src/js/components/Toast.js`
* **Interações & Eventos**:
  * Se autodestrói após 3000ms através de um `setTimeout` interno que remove o elemento do DOM.

---

### 12. SkeletonLoader (Carregador de Estrutura)
* **Objetivo**: Renderiza silhuetas cinzas animadas com efeito de pulso luminoso (shimmer) enquanto os dados reais do cardápio estão sendo carregados da rede.
* **Arquivos**:
  * Código: `src/js/components/SkeletonLoader.js`
