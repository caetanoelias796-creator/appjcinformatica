# Diretrizes de Contribuição — PizzaFlow

Para garantir a estabilidade, performance e legibilidade do código-fonte do **PizzaFlow**, todos os desenvolvedores (internos ou externos) devem seguir estritamente as regras de arquitetura e padrões operacionais descritos neste documento.

---

## 🚫 Regras Arquiteturais Cruciais

### 1. Nenhuma Regra de Negócio na Camada de Apresentação (UI)
* **Regra**: Arquivos sob `src/js/components/` e `src/js/pages/` não devem conter qualquer lógica de cálculo, verificação de consistência de pizzas ou validação de regras de cupons/pedidos.
* **Por que**: A UI deve ser burra, preocupando-se apenas com a renderização de tags e captura de eventos do usuário.
* **Como fazer**: Qualquer validação operacional de pizzas deve ser delegada a `PizzaRules.js`. Validações de checkout devem usar `OrderValidator.js`.

### 2. Sem Acesso ou Referência ao DOM no Core e Domain
* **Regra**: Módulos sob `src/core/` e `src/domain/` não podem referenciar o objeto global `document`, o objeto `window`, consultar seletores CSS (`querySelector`), ou manipular elementos HTML.
* **Por que**: O Core e o Domínio devem ser compostos de funções e classes puras, permitindo sua execução isolada em testes unitários ou em ambientes server-side (Node.js).
* **Como fazer**: Se um método do domínio precisa de dados da tela, esses dados devem ser passados como parâmetros puros (Strings, Numbers ou objetos JSON básicos).

### 3. Cálculos Financeiros Exclusivos no `PriceEngine` e `Summary`
* **Regra**: É expressamente proibido efetuar operações aritméticas de multiplicação ou soma de preços diretamente em componentes visuais ou controllers.
* **Por que**: Evita erros crônicos de arredondamento de ponto flutuante e garante centralização nas atualizações das políticas financeiras da empresa.
* **Como fazer**: Todos os cálculos de itens individuais devem passar por `PriceEngine.js`. O consolidado financeiro do carrinho é calculado por `Summary.js` sob a camada de domínio.

### 4. Fluxo de Comunicação Unificado via `EventBus`
* **Regra**: Componentes não podem invocar métodos de outros componentes diretamente. Qualquer notificação de mudança de estado que afete múltiplos elementos na tela deve obrigatoriamente transitar por publicação no barramento `EventBus`.
* **Como fazer**:
  * Ao criar um componente dinâmico no método `build()`, assine os eventos desejados e armazene a função de retorno.
  * No método `destroy()`, invoque todas as funções de retorno de inscrição coletadas para evitar vazamento de memória (leak).

### 5. Estado Global Exclusivo na Store
* **Regra**: Nenhuma variável global solta ou propriedade interna da interface deve armazenar estados compartilhados da aplicação.
* **Como fazer**: Centralize as alterações de estado despachando ações (`dispatch()`) para o `store.js` global ou consumindo a interface reativa da `CartStore.js`.

---

## 🛠️ Processo de Criação de Recursos (Workflow)

Ao desenvolver um novo recurso no PizzaFlow:
1. **Defina no Domínio**: Crie ou estenda as classes sob `src/domain/` para conter as propriedades e comportamentos do recurso.
2. **Catalogar o Evento**: Adicione qualquer novo canal de mensagens criado no arquivo `docs/EVENTS.md`.
3. **Crie a Apresentação**: Escreva a fábrica do componente sob `src/js/components/`, implementando as interfaces de ciclo de vida (`build` e `destroy`).
4. **Validar Localmente**: Execute a verificação de compilação:
   ```bash
   npm run build
   ```
   Certifique-se de que a build de produção é gerada sem nenhum erro de sintaxe ou de importação.
