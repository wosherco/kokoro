/**
 * A type that represents a value that can be used as an object key
 */
type PropertyKey = string | number | symbol;

/**
 * Type for the iteratee function that can be passed to groupBy
 * @template T The type of elements in the collection
 * @template K The type of the key that will be used for grouping
 */
export type PropertyIteratee<T, K extends PropertyKey = PropertyKey> =
  | ((value: T) => K)
  | keyof T;
