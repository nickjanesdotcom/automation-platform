/**
 * Generic parsing utilities.
 */

import * as cheerio from 'cheerio';

/**
 * Extract email from text
 */
export function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

/**
 * Extract multiple emails from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract phone numbers from text
 */
export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
  return text.match(phoneRegex) || [];
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Parse HTML to plain text
 */
export function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  return $('body').text().trim();
}

/**
 * Extract text from HTML elements
 */
export function extractFromHtml(html: string, selector: string): string[] {
  const $ = cheerio.load(html);
  const results: string[] = [];

  $(selector).each((_, element) => {
    results.push($(element).text().trim());
  });

  return results;
}

/**
 * Parse currency amount from text
 */
export function parseCurrency(text: string): number | null {
  const currencyRegex = /\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/;
  const match = text.match(currencyRegex);

  if (match) {
    const amount = match[1].replace(/,/g, '');
    return parseFloat(amount);
  }

  return null;
}

/**
 * Parse date from text
 */
export function parseDate(text: string): Date | null {
  try {
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Clean whitespace from text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Parse key-value pairs from text
 */
export function parseKeyValuePairs(text: string): Record<string, string> {
  const pairs: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2].trim();
      pairs[key] = value;
    }
  }

  return pairs;
}
