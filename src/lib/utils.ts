import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah currency format
 * e.g. 150000 -> "Rp 150.000"
 */
export function formatRupiah(amount: number, withPrefix: boolean = true): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount);
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format number according to currency code (IDR, USD, EUR, SGD, MYR, JPY, GBP, AUD)
 * Defaults to IDR (Indonesian Rupiah)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'IDR',
  withPrefix: boolean = true
): string {
  const code = (currencyCode || 'IDR').toUpperCase();
  try {
    const formatted = new Intl.NumberFormat(code === 'IDR' ? 'id-ID' : 'en-US', {
      maximumFractionDigits: code === 'IDR' || code === 'JPY' ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount);

    if (!withPrefix) return formatted;

    const symbols: Record<string, string> = {
      IDR: 'Rp',
      USD: '$',
      EUR: '€',
      SGD: 'S$',
      MYR: 'RM',
      JPY: '¥',
      GBP: '£',
      AUD: 'A$',
    };

    const symbol = symbols[code] || code;
    return `${symbol} ${formatted}`;
  } catch {
    return withPrefix ? `${code} ${amount.toLocaleString()}` : amount.toLocaleString();
  }
}

/**
 * Get current date/time ISO string formatted with Asia/Jakarta (WIB) offset (+07:00)
 */
export function getWIBISOString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  // Asia/Jakarta is UTC+7
  const wibTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const year = wibTime.getUTCFullYear();
  const month = pad(wibTime.getUTCMonth() + 1);
  const day = pad(wibTime.getUTCDate());
  const hours = pad(wibTime.getUTCHours());
  const minutes = pad(wibTime.getUTCMinutes());
  const seconds = pad(wibTime.getUTCSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

/**
 * Convert Date or ISO string to Date object
 */
export function toWIB(date: Date | string = new Date()): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Format Date to Indonesian formatted date string in WIB (Asia/Jakarta)
 * e.g. "Senin, 13 Oktober 2026 — 14:30 WIB"
 */
export function formatWIBDate(date: Date | string = new Date(), includeTime: boolean = true): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const dayName = partMap.weekday || 'Senin';
  const day = partMap.day || '1';
  const monthName = partMap.month || 'Januari';
  const year = partMap.year || '2026';
  const hour = (partMap.hour || '00').padStart(2, '0');
  const minute = (partMap.minute || '00').padStart(2, '0');

  if (includeTime) {
    return `${dayName}, ${day} ${monthName} ${year} — ${hour}:${minute} WIB`;
  }
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Generate visual ASCII progress bar with █ and ░ (Length: 10 chars)
 * e.g. 60% -> "██████░░░░"
 */
export function generateProgressBar(percentage: number, length: number = 10): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const filledCount = Math.min(length, Math.round((clamped / 100) * length));
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}

/**
 * Parse Indonesian colloquial amounts:
 * "15rb", "15ribu", "15 rb" -> 15000
 * "1.5jt", "1,5jt", "1.5 jt" -> 1500000
 * "500k", "25k", "500 k"    -> 500000, 25000
 * "10jt"                     -> 10000000
 * "100.000", "100000"        -> 100000
 * "50.000 rupiah", "2000 perak" -> 50000, 2000
 */
export function parseIndonesianColloquialAmount(text: string): number | null {
  if (!text) return null;
  // Clean prefix 'rp.' / 'rp' and suffixes 'rupiah' / 'perak'
  let clean = text.toLowerCase().trim()
    .replace(/^rp\.?\s*/i, '')
    .replace(/\s*(?:rupiah|perak)\s*$/i, '')
    .trim();

  // Pattern for Million (jt / juta): e.g. "1.5jt", "1,5jt", "1.5 juta", "5 jt"
  const jtMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:jt|juta)$/i);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return isNaN(val) ? null : Math.round(val * 1000000);
  }

  // Pattern for Thousand (rb / ribu / k): e.g. "15rb", "15ribu", "15 ribu", "500k", "2.5k"
  const rbMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)$/i);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return isNaN(val) ? null : Math.round(val * 1000);
  }

  // Pattern for standard numbers with dots or plain digits: e.g. "150.000" or "150000"
  const plainNum = clean.replace(/[.,]/g, '');
  if (/^\d+$/.test(plainNum)) {
    const val = parseInt(plainNum, 10);
    return isNaN(val) ? null : val;
  }

  return null;
}
