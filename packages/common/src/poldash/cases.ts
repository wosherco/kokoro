/**
 * Functions for converting strings between different case formats.
 * Supports camelCase, pascalCase, snake_case, kebab-case, and more.
 */

/**
 * Converts a string to camelCase.
 *
 * @param str The string to convert
 * @returns The camelCase version of the input string
 *
 * @example
 * ```typescript
 * toCamelCase('hello_world')
 * // => 'helloWorld'
 *
 * toCamelCase('hello-world')
 * // => 'helloWorld'
 *
 * toCamelCase('HelloWorld')
 * // => 'helloWorld'
 * ```
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char: string) =>
      char ? char.toUpperCase() : "",
    )
    .replace(/^([A-Z])/, (match) => match.toLowerCase());
}

/**
 * Converts a string to PascalCase.
 *
 * @param str The string to convert
 * @returns The PascalCase version of the input string
 *
 * @example
 * ```typescript
 * toPascalCase('hello_world')
 * // => 'HelloWorld'
 *
 * toPascalCase('hello-world')
 * // => 'HelloWorld'
 * ```
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char: string) =>
      char ? char.toUpperCase() : "",
    )
    .replace(/^./, (match) => match.toUpperCase());
}

/**
 * Converts a string to snake_case.
 *
 * @param str The string to convert
 * @returns The snake_case version of the input string
 *
 * @example
 * ```typescript
 * toSnakeCase('helloWorld')
 * // => 'hello_world'
 *
 * toSnakeCase('hello-world')
 * // => 'hello_world'
 *
 * toSnakeCase('HelloWorld')
 * // => 'hello_world'
 * ```
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

/**
 * Converts a string to kebab-case.
 *
 * @param str The string to convert
 * @returns The kebab-case version of the input string
 *
 * @example
 * ```typescript
 * toKebabCase('helloWorld')
 * // => 'hello-world'
 *
 * toKebabCase('hello_world')
 * // => 'hello-world'
 *
 * toKebabCase('HelloWorld')
 * // => 'hello-world'
 * ```
 */
export function toKebabCase(str: string): string {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * Converts a string to CONSTANT_CASE.
 *
 * @param str The string to convert
 * @returns The CONSTANT_CASE version of the input string
 *
 * @example
 * ```typescript
 * toConstantCase('helloWorld')
 * // => 'HELLO_WORLD'
 *
 * toConstantCase('hello-world')
 * // => 'HELLO_WORLD'
 * ```
 */
export function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase();
}
