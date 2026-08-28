/**
 * Shared text-processing helpers used by the resume and job-description
 * parsers: normalisation, sentence/line splitting and word counting.
 */

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toLines(text: string): string[] {
  return normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  const matches = text.match(/[A-Za-z0-9+#./-]+/g);
  return matches ? matches.length : 0;
}

/** Escapes a literal string so it can be embedded in a RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Case-insensitive "whole term" test. Word boundaries are computed manually
 * because skills such as `C++`, `Node.js` and `A/B Testing` contain
 * characters that \b does not treat as word characters.
 */
export function containsTerm(haystackLower: string, term: string): boolean {
  const needle = term.toLowerCase();
  let index = haystackLower.indexOf(needle);
  while (index !== -1) {
    const before = haystackLower[index - 1];
    const after = haystackLower[index + needle.length];
    const boundaryBefore = before === undefined || !/[a-z0-9]/.test(before);
    const boundaryAfter = after === undefined || !/[a-z0-9]/.test(after);
    if (boundaryBefore && boundaryAfter) return true;
    index = haystackLower.indexOf(needle, index + 1);
  }
  return false;
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
