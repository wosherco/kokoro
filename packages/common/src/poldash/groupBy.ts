import type { PropertyIteratee } from "./types";

/**
 * Creates an object composed of keys generated from the results of running each element
 * of collection through iteratee. The corresponding value of each key is an array of
 * elements responsible for generating the key. The iteratee is invoked with one argument: (value).
 *
 * @template T The type of elements in the collection
 * @template K The type of the keys in the resulting object
 * @param collection The collection to iterate over
 * @param iteratee The iteratee to transform keys
 * @returns Returns the composed aggregate object
 *
 * @example
 * ```typescript
 * groupBy([6.1, 4.2, 6.3], Math.floor)
 * // => { '4': [4.2], '6': [6.1, 6.3] }
 *
 * groupBy(['one', 'two', 'three'], 'length')
 * // => { '3': ['one', 'two'], '5': ['three'] }
 * ```
 */
export function groupBy<T, K extends PropertyKey>(
  collection: T[] | Record<PropertyKey, T>,
  iteratee: PropertyIteratee<T, K>,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  // Convert iteratee to a function if it's a property key
  const iterateeFn =
    typeof iteratee === "function"
      ? iteratee
      : (value: T) => value[iteratee] as unknown as K;

  // Handle both array and object collections
  const values = Array.isArray(collection)
    ? collection
    : Object.values(collection);

  // Group the values
  for (const value of values) {
    const key = iterateeFn(value);
    if (!(key in result)) {
      result[key] = [];
    }
    result[key].push(value);
  }

  return result;
}
