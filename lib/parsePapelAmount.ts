const MAX_PAPEL_AMOUNT = 99_999_999.99;

/**
 * Admin Papel miktarı: 1250, 1.250, 1,250, 12,5, 12.50, 1.250,50
 */
export function parsePapelAmount(input: unknown): number | null {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) return null;
    const rounded = Number(input.toFixed(2));
    if (rounded <= 0 || rounded > MAX_PAPEL_AMOUNT) return null;
    return rounded;
  }

  if (typeof input !== 'string') return null;

  const raw = input.trim().replace(/\s/g, '');
  if (!raw || /[eE+]/.test(raw)) return null;

  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  let normalized = raw;

  if (hasComma && hasDot) {
    const lastComma = raw.lastIndexOf(',');
    const lastDot = raw.lastIndexOf('.');
    normalized =
      lastComma > lastDot
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw.replace(/,/g, '');
  } else if (hasComma) {
    const parts = raw.split(',');
    normalized =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0]}.${parts[1]}`
        : raw.replace(/,/g, '');
  } else if (hasDot) {
    const parts = raw.split('.');
    if (!(parts.length === 2 && parts[1].length <= 2)) {
      normalized = raw.replace(/\./g, '');
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_PAPEL_AMOUNT) return null;
  return Number(value.toFixed(2));
}

export function sanitizePapelAmountInput(raw: string): string {
  return raw.replace(/[^\d.,\s]/g, '');
}

export function formatPapelAmount(value: number, locale = 'tr-TR'): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
