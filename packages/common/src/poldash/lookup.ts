import type { LookupIteratee, LookupKey } from "./types";

// Helper function to convert a key to string, handling dates specially
const keyToString = (key: LookupKey): string => {
  if (key instanceof Date) {
    return key.getTime().toString();
  }
  return String(key);
};

/**
 * Creates a lookup function for an array of objects with strong typing support.
 * Allows for fast O(1) lookups of objects by key.
 * Date objects are automatically converted to unix timestamps for efficient comparison.
 *
 * @template T The type of elements in the collection
 * @template K The type of the keys in the resulting lookup map
 * @param collection The array of objects to create a lookup for
 * @param keySelector Property name or function to extract the lookup key
 * @returns A lookup function that efficiently retrieves objects by key
 *
 * @example
 * ```typescript
 * const users = [
 *   { id: 1, email: "john@example.com", name: "John" },
 *   { id: 2, email: "jane@example.com", name: "Jane" }
 * ];
 *
 * // Create lookup by id
 * const getUserById = lookup(users, "id");
 * const user = getUserById(1); // Returns { id: 1, email: "john@example.com", name: "John" }
 *
 * // Example with dates
 * const events = [
 *   { date: new Date('2023-01-01'), title: "New Year" },
 *   { date: new Date('2023-12-25'), title: "Christmas" }
 * ];
 * const getEventByDate = lookup(events, "date");
 * const event = getEventByDate(new Date('2023-01-01')); // Returns New Year event
 * ```
 */
export function lookup<T, K extends LookupKey>(
  collection: T[] | Record<PropertyKey, T>,
  keySelector: LookupIteratee<T, K>
): (key: K) => T | undefined {
  // Convert collection to array if it's an object
  const items = Array.isArray(collection)
    ? collection
    : Object.values(collection);

  // Create key selector function
  const keySelectorFn =
    typeof keySelector === "function"
      ? keySelector
      : (item: T) => item[keySelector] as unknown as K;

  // Build lookup map
  const lookupMap = new Map<string, T>();
  for (const item of items) {
    const key = keySelectorFn(item);
    const keyString = keyToString(key);
    lookupMap.set(keyString, item);
  }

  // Return lookup function
  return (key: K) => {
    const keyString = keyToString(key);
    return lookupMap.get(keyString);
  };
}
