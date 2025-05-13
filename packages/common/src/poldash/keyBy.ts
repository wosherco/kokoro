import type { PropertyIteratee } from "./types";

/**
 * Creates an object composed of keys generated from the results of running each element
 * of collection through iteratee. The corresponding value of each key is the transformed
 * value of the original object (or the original object itself if no transformer is provided).
 *
 * @template T The type of elements in the collection
 * @template K The type of the keys in the resulting object
 * @template R The type of the transformed values
 * @param collection The collection to iterate over
 * @param iteratee The iteratee to extract keys
 * @param transformer Optional function to transform values (can be async)
 * @returns Returns the composed object with keys and transformed values
 *
 * @example
 * ```typescript
 * // Basic usage with key extraction
 * keyBy([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }], 'id')
 * // => { '1': { id: 1, name: 'John' }, '2': { id: 2, name: 'Jane' } }
 *
 * // With value transformation
 * keyBy([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }], 'id', item => item.name)
 * // => { '1': 'John', '2': 'Jane' }
 *
 * // With async transformation
 * await keyBy(
 *   [{ id: 1, url: 'example.com/1' }, { id: 2, url: 'example.com/2' }],
 *   'id',
 *   async item => await fetchData(item.url)
 * )
 * ```
 */
export async function keyBy<T, K extends PropertyKey, R = T>(
  collection: T[] | Record<PropertyKey, T>,
  iteratee: PropertyIteratee<T, K>,
  transformer?: (value: T) => R | Promise<R>,
): Promise<Record<K, R>> {
  const result = {} as Record<K, R>;

  // Convert iteratee to a function if it's a property key
  const iterateeFn =
    typeof iteratee === "function"
      ? iteratee
      : (value: T) => value[iteratee] as unknown as K;

  // Handle both array and object collections
  const values = Array.isArray(collection)
    ? collection
    : Object.values(collection);

  // Use the identity function if no transformer is provided
  const transformFn = transformer ?? ((value) => value as unknown as R);

  // Process values and apply transformations
  const transformations = values.map(async (value) => {
    const key = iterateeFn(value);
    const transformed = await transformFn(value);
    return { key, transformed };
  });

  // Wait for all transformations to complete
  const results = await Promise.all(transformations);

  // Populate the result object
  for (const { key, transformed } of results) {
    result[key] = transformed;
  }

  return result;
}

/**
 * Synchronous version of keyBy that doesn't support async transformers
 */
export function keyBySync<T, K extends PropertyKey, R = T>(
  collection: T[] | Record<PropertyKey, T>,
  iteratee: PropertyIteratee<T, K>,
  transformer?: (value: T) => R,
): Record<K, R> {
  const result = {} as Record<K, R>;

  // Convert iteratee to a function if it's a property key
  const iterateeFn =
    typeof iteratee === "function"
      ? iteratee
      : (value: T) => value[iteratee] as unknown as K;

  // Handle both array and object collections
  const values = Array.isArray(collection)
    ? collection
    : Object.values(collection);

  // Use the identity function if no transformer is provided
  const transformFn = transformer ?? ((value) => value as unknown as R);

  // Process values
  for (const value of values) {
    const key = iterateeFn(value);
    result[key] = transformFn(value);
  }

  return result;
}
