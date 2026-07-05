/**
 * PizzaFlow — Formatters
 * Funções de formatação de dados para exibição na UI.
 */

/* ==========================================================================
   FORMATAÇÃO DE PREÇOS
   ========================================================================== */

/**
 * Formata número como moeda BRL
 * @param {number} value
 * @returns {string} ex: "R$ 45,90"
 */
export function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata número como moeda BRL sem símbolo
 * @param {number} value
 * @returns {string} ex: "45,90"
 */
export function formatCurrencyRaw(value) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calcula e formata o preço com desconto
 * @param {number} originalPrice
 * @param {number} discountPercent
 * @returns {string}
 */
export function formatDiscountedPrice(originalPrice, discountPercent) {
  const discounted = originalPrice * (1 - discountPercent / 100);
  return formatCurrency(discounted);
}

/**
 * Formata porcentagem de desconto
 * @param {number} percent
 * @returns {string} ex: "-30%"
 */
export function formatDiscount(percent) {
  return `-${Math.round(percent)}%`;
}

/* ==========================================================================
   FORMATAÇÃO DE TEMPO
   ========================================================================== */

/**
 * Formata intervalo de tempo de entrega
 * @param {number} minMinutes
 * @param {number} maxMinutes
 * @returns {string} ex: "35–45 min"
 */
export function formatDeliveryTime(minMinutes, maxMinutes) {
  return `${minMinutes}–${maxMinutes} min`;
}

/**
 * Formata data no padrão brasileiro
 * @param {string|Date} date
 * @returns {string} ex: "04/07/2026"
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data e hora no padrão brasileiro
 * @param {string|Date} date
 * @returns {string} ex: "04/07/2026 às 14:35"
 */
export function formatDateTime(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' às');
}

/**
 * Retorna tempo relativo
 * @param {string|Date} date
 * @returns {string} ex: "há 5 minutos"
 */
export function formatRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const diff = (new Date(date) - new Date()) / 1000; // segundos

  if (Math.abs(diff) < 60)   return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400)return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

/* ==========================================================================
   FORMATAÇÃO DE TEXTO
   ========================================================================== */

/**
 * Capitaliza a primeira letra de cada palavra
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Trunca texto com ellipsis
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Remove acentos e normaliza texto para busca
 * @param {string} str
 * @returns {string}
 */
export function normalizeForSearch(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Formata número de avaliações
 * @param {number} count
 * @returns {string} ex: "1.2k" ou "342"
 */
export function formatReviewCount(count) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

/**
 * Formata rating com estrela
 * @param {number} rating
 * @returns {string} ex: "⭐ 4.8"
 */
export function formatRating(rating) {
  return `⭐ ${rating.toFixed(1)}`;
}

/**
 * Gera string de ingredientes
 * @param {string[]} ingredients
 * @param {number} [max=4]
 * @returns {string}
 */
export function formatIngredients(ingredients, max = 4) {
  if (ingredients.length <= max) {
    return ingredients.join(', ');
  }
  const shown = ingredients.slice(0, max);
  const remaining = ingredients.length - max;
  return `${shown.join(', ')} +${remaining}`;
}

/* ==========================================================================
   FORMATAÇÃO DO CARRINHO
   ========================================================================== */

/**
 * Formata contagem de itens do carrinho
 * @param {number} count
 * @returns {string} ex: "3 itens" ou "1 item"
 */
export function formatCartCount(count) {
  return count === 1 ? '1 item' : `${count} itens`;
}

/**
 * Formata subtotal de um item
 * @param {number} price
 * @param {number} quantity
 * @returns {string}
 */
export function formatItemTotal(price, quantity) {
  return formatCurrency(price * quantity);
}

/* ==========================================================================
   ENDEREÇO
   ========================================================================== */

/**
 * Trunca endereço para exibição compacta
 * @param {string} address
 * @param {number} [maxLength=35]
 * @returns {string}
 */
export function truncateAddress(address, maxLength = 35) {
  return truncate(address, maxLength);
}
