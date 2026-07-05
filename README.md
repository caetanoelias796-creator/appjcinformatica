# JC Informática — Website Oficial

## 🏢 Sobre o Projeto

Website institucional completo para a **JC Informática**, empresa de Nova Petrópolis, RS especializada em:
- Assistência técnica para computadores e notebooks
- Equipamentos gamer
- Automação comercial

---

## ✅ Funcionalidades Implementadas

### Identidade Visual
- Paleta oficial: **Preto Absoluto #000000**, **Azul Cósmico #0037FF**, **Branco Nebuloso #F5F5F5**
- Tipografia: **Barlow Condensed 900** (títulos) + **Sora** (textos)
- Monograma JC recriado em SVG com máxima fidelidade à identidade visual oficial
- Padrão de triângulos animados no background (fiel ao material de apresentação)

### Página Principal (`index.html`)
- **Header fixo** com efeito glassmorphism ao rolar
- **Menu mobile** com slide lateral animado
- **Hero Section** com monograma JC grande, glows, anéis orbitais animados, badge com indicador ativo
- **Marquee Strip** com serviços em loop infinito
- **Barra de Estatísticas** com contadores animados (1200+ clientes, 10+ anos, 98% satisfação, 24h prazo)
- **6 Cards de Serviços** com hover effects (borda azul, elevação, ícone preenchido)
- **Seção Gamer** com cards de especificações (CPU, GPU, RAM, Storage) e badge FPS
- **Automação Comercial** com 6 cards de serviços empresariais
- **Sobre** com grid hexagonal de ícones e valores da empresa
- **Depoimentos** com 3 cards de clientes + depoimento em destaque
- **CTA Section** com botão WhatsApp e botão Mensagem
- **Footer completo** com 4 colunas (brand, serviços, empresa, contato)
- **Botão flutuante WhatsApp** (animado, canto inferior direito)
- **Botão Voltar ao Topo**

### Página de Contato (`contato.html`)
- **Hero** com título e descrição
- **Cards de Informações** (WhatsApp, telefone, e-mail, endereço, horários, redes sociais)
- **Google Maps** embebido (Nova Petrópolis, RS) com filtro escuro
- **Formulário de Contato** com validação e envio para Table API (`tables/contatos`)
- **FAQ Accordion** nativo com 6 perguntas frequentes
- **CTA WhatsApp** ao final
- **Botão flutuante WhatsApp**

### JavaScript (`js/main.js`)
1. Header scroll effect (glassmorphism)
2. Menu mobile (abrir/fechar, fechar ao clicar fora)
3. Scroll spy (link ativo na navegação)
4. Scroll reveal animations (IntersectionObserver)
5. Contadores animados (easing cúbico)
6. Botão voltar ao topo
7. Smooth scroll para âncoras
8. Formulário de contato (POST para `tables/contatos`)
9. Marquee loop duplicado
10. Gamer cards stagger entrance
11. Hero badge fade-in

---

## 📂 Estrutura de Arquivos

```
index.html              — Página principal
contato.html            — Página de contato + FAQ
css/
  style.css             — Estilos completos (~1800 linhas)
js/
  main.js               — JavaScript interativo
assets/
  JC_apresentacao.pdf   — Apresentação da identidade visual (referência)
README.md
```

---

## 🌐 URLs / Rotas

| Página        | Arquivo           | Seções (âncoras)                                            |
|---------------|-------------------|-------------------------------------------------------------|
| Home          | `index.html`      | `#hero`, `#stats`, `#servicos`, `#gamer`, `#automacao`, `#sobre`, `#depoimentos`, `#cta` |
| Contato       | `contato.html`    | Formulário, FAQ, mapa                                       |

---

## 🗄️ Tabela de Dados

**Tabela:** `contatos`

| Campo     | Tipo   | Descrição                      |
|-----------|--------|--------------------------------|
| id        | text   | UUID automático                |
| nome      | text   | Nome do cliente                |
| email     | text   | E-mail do cliente              |
| telefone  | text   | Telefone/WhatsApp              |
| servico   | text   | Tipo de serviço selecionado    |
| mensagem  | text   | Mensagem enviada               |
| data      | text   | Data/hora do envio (ISO)       |

API: `POST tables/contatos`

---

## 🎨 Paleta de Cores Oficial

| Nome             | Hex       | RGB           |
|------------------|-----------|---------------|
| Preto Absoluto   | `#000000` | R0 G0 B0      |
| Azul Cósmico     | `#0037FF` | R0 G55 B255   |
| Branco Nebuloso  | `#F5F5F5` | R245 G245 B245|

---

## ✅ Dados Reais Configurados

| Campo            | Valor                                                                 |
|------------------|-----------------------------------------------------------------------|
| WhatsApp/Telefone| (54) 3281-4464 — `wa.me/555432814464`                                 |
| Endereço         | Saint Germain – Av. 15 de Novembro, 1540, Sala 110, Centro, Nova Petrópolis – RS, 95150-000 |
| Facebook         | facebook.com/jcinformatica.br                                         |
| Instagram        | instagram.com/jcinformaticanp                                         |
| E-mail           | contato@jcinformatica.net.br                                          |
| Horários         | Seg–Sex: 9h–12h / 13h20–18h30 · Sáb: 8h30–12h / 13h30–16h · Dom: Fechado |

---

## 🚀 Próximas Etapas

- [ ] Adicionar fotos reais da loja e da equipe
- [ ] Atualizar iframe do Google Maps com o Place ID exato da loja no Google Business
- [ ] Criar página de serviços detalhada (`servicos.html`)
- [ ] Adicionar galeria de antes/depois de equipamentos
- [ ] Implementar chat online (Tawk.to ou similar)
- [ ] Adicionar Google Analytics / Meta Pixel
- [ ] Criar blog/dicas de informática

---

## 🌐 Publicar

Para colocar o site no ar: acesse a aba **Publish** e clique em **Publish**.
