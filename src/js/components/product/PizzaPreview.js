/**
 * PizzaFlow — Pizza Preview Component
 * Visualização dinâmica da pizza montada (sabores divididos, tamanho e extras).
 */

/**
 * Cria a prévia da pizza
 * @returns {{ el: HTMLElement, update: Function }}
 */
export function PizzaPreview() {
  let element = null;

  /* ── BUILD ─────────────────────────────────────────────── */
  function build() {
    element = document.createElement('div');
    element.className = 'pizza-preview-wrapper';
    element.setAttribute('aria-hidden', 'true');
    return element;
  }

  /* ── UPDATE ─────────────────────────────────────────────── */
  function update(state) {
    if (!element) return;

    const { product, size, flavors, crust, extras } = state;
    if (!product) return;

    const sizeClass = size ? `size-${size.id}` : 'size-media';
    const hasCrust = crust && crust.id !== 'sem-borda';
    
    // 1. Determina as imagens para renderizar
    const flavorImages = flavors.map(f => f.image).filter(Boolean);
    if (flavorImages.length === 0) {
      flavorImages.push(product.image);
    }

    let flavorsHtml = '';
    
    if (flavorImages.length === 1) {
      // 1 sabor: pizza cheia
      flavorsHtml = `
        <div class="pizza-flavor-full" style="
          width: 100%; height: 100%; border-radius: 50%;
          background-image: url('${flavorImages[0]}'); background-size: cover; background-position: center;
          transition: background-image 0.3s ease;
        "></div>
      `;
    } else if (flavorImages.length === 2) {
      // 2 sabores: meio a meio
      flavorsHtml = `
        <div class="pizza-flavor-half pizza-flavor-left" style="background-image: url('${flavorImages[0]}');"></div>
        <div class="pizza-flavor-half pizza-flavor-right" style="background-image: url('${flavorImages[1]}');"></div>
      `;
    } else {
      // 3 ou 4 sabores: 4 fatias (quadrantes)
      const img1 = flavorImages[0];
      const img2 = flavorImages[1];
      const img3 = flavorImages[2] || img1;
      const img4 = flavorImages[3] || img2;

      flavorsHtml = `
        <div class="pizza-flavor-quarter q1" style="background-image: url('${img1}');"></div>
        <div class="pizza-flavor-quarter q2" style="background-image: url('${img2}');"></div>
        <div class="pizza-flavor-quarter q3" style="background-image: url('${img3}');"></div>
        <div class="pizza-flavor-quarter q4" style="background-image: url('${img4}');"></div>
      `;
    }

    // 2. Renderiza os ingredientes extras como badges flutuantes
    const emojiMap = {
      bacon: '🥓',
      catupiry: '🧀',
      cheddar: '🧀',
      azeitona: '🫒',
      tomate: '🍅',
      cebola: '🧅',
      milho: '🌽'
    };

    let extrasHtml = '';
    if (extras && extras.length > 0) {
      extras.forEach((extra, index) => {
        const emoji = emojiMap[extra.id] || '✨';
        
        // Coordenadas polares para posicionar em círculo sobre a pizza
        const angle = (index * (360 / extras.length)) * (Math.PI / 180);
        const radius = 60; // distância do centro em px
        const x = Math.round(110 + radius * Math.cos(angle) - 12);
        const y = Math.round(110 + radius * Math.sin(angle) - 12);
        
        // Pequena variação de animação baseada no index
        const delay = (index * 0.4).toFixed(1);

        extrasHtml += `
          <div class="pizza-preview-extra-badge" style="
            left: ${x}px; 
            top: ${y}px; 
            animation-delay: ${delay}s;
          ">${emoji}</div>
        `;
      });
    }

    // 3. Renderiza o HTML final
    element.innerHTML = `
      <div class="pizza-preview-base ${sizeClass}">
        ${flavorsHtml}
        <div class="pizza-preview-border-glow ${hasCrust ? 'active' : ''}"></div>
      </div>
      ${extrasHtml}
    `;
  }

  return { build, update };
}
