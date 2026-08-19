/**
 * General formatting utilities.
 */

/** Format a number as Ethiopian Birr */
export function formatCurrency(amount: number): string {
  return `ETB ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/** Compact currency (e.g. ETB 1.25M) */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `ETB ${(amount / 1_000_000).toFixed(2)}M`;
  return formatCurrency(amount);
}

/** Capitalise first letter of each word */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Slugify a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncate text to a max length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
