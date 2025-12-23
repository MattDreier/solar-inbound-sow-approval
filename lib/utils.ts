import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatter
export function formatCurrency(value: string | number | null): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

// Display formatter (show "-" for null/empty)
export function formatValue(value: string | number | null): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

// Percentage formatter
export function formatPercent(value: string | number | null): string {
  if (value === null || value === undefined) return '-';
  return `${value}%`;
}

// Date formatter
export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '-';
  try {
    return new Date(isoDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

// Adder label formatter (convert camelCase to Title Case, strip redundant "Adder" suffix)
export function formatAdderLabel(key: string): string {
  return key
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Split on spaces
    .split(' ')
    // Capitalize first letter of each word
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    // Join back together
    .join(' ')
    .trim()
    // Remove trailing "Adder" since section header is already "Adders"
    .replace(/ Adder$/, '');
}

// Check if a value should be displayed (not null/undefined/empty)
export function hasValue(value: string | number | null | undefined): boolean {
  return value !== null && value !== undefined && value !== '';
}
