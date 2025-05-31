/**
 * A type that represents a value that can be used as an object key
 */
type PropertyKey = string | number | symbol;

/**
 * A type that represents a value that can be used as a lookup key,
 * including Date objects which are converted to unix timestamps
 */
export type LookupKey = PropertyKey | Date;

/**
 * Type for the iteratee function that can be passed to groupBy
 * @template T The type of elements in the collection
 * @template K The type of the key that will be used for grouping
 */
export type PropertyIteratee<T, K extends PropertyKey = PropertyKey> =
  | ((value: T) => K)
  | keyof T;

/**
 * Type for the iteratee function that can be passed to lookup functions
 * @template T The type of elements in the collection
 * @template K The type of the key that will be used for lookup (includes Date)
 */
export type LookupIteratee<T, K extends LookupKey = LookupKey> =
  | ((value: T) => K)
  | keyof T;
