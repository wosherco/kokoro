/**
 * String utility functions for truncation and escaping.
 */

/**
 * Truncates a string if it exceeds the specified maximum length.
 * Optionally adds a suffix to indicate truncation.
 *
 * @param str The string to truncate
 * @param maxLength The maximum allowed length of the string
 * @param suffix The suffix to add when truncation occurs (default: '...')
 * @returns The truncated string
 *
 * @example
 * ```typescript
 * truncate('Hello world', 5)
 * // => 'Hello...'
 *
 * truncate('Hello world', 5, '…')
 * // => 'Hello…'
 *
 * truncate('Hello', 10)
 * // => 'Hello' (no truncation needed)
 * ```
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "...",
): string {
  if (!str || str.length <= maxLength) {
    return str;
  }

  // Account for the suffix length
  const truncateAt = maxLength - suffix.length;
  return truncateAt > 0
    ? str.slice(0, truncateAt) + suffix
    : str.slice(0, maxLength);
}

/**
 * Escapes double quotes in a string.
 *
 * @param str The string to escape
 * @returns The escaped string
 *
 * @example
 * ```typescript
 * escapeDoubleQuotes('Hello "world"')
 * // => 'Hello \"world\"'
 * ```
 */
export function escapeDoubleQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

/**
 * Escapes special HTML characters in a string.
 *
 * @param str The string to escape
 * @returns The escaped string
 *
 * @example
 * ```typescript
 * escapeHtml('<div>Hello & "world"</div>')
 * // => '&lt;div&gt;Hello &amp; &quot;world&quot;&lt;/div&gt;'
 * ```
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escapes special characters for use in a regular expression.
 *
 * @param str The string to escape
 * @returns The escaped string
 *
 * @example
 * ```typescript
 * escapeRegExp('hello.world*')
 * // => 'hello\\.world\\*'
 * ```
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
