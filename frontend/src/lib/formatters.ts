/**
 * Formata preços de criptomoedas dinamicamente com base no valor.
 * - Valores >= 1: 2 casas decimais (ex: 77,359.99)
 * - Valores < 1 e >= 0.01: 2 a 4 casas decimais (ex: 0.45)
 * - Valores < 0.01 e >= 0.0001: 4 a 6 casas decimais (ex: 0.0012)
 * - Valores < 0.0001: 8 casas decimais (ex: 0.00000160)
 */
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || numPrice === 0) return '0.00';
  
  const absPrice = Math.abs(numPrice);
  
  if (absPrice >= 1) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numPrice);
  }
  
  if (absPrice >= 0.01) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(numPrice);
  }

  if (absPrice >= 0.0001) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(numPrice);
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  }).format(numPrice);
};

/**
 * Formata porcentagem com sinal e 2 casas decimais.
 */
export const formatPercent = (percent: number | string): string => {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent;
  if (isNaN(num)) return '0.00%';
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  
  return num > 0 ? `+${formatted}%` : `${formatted}%`;
};
