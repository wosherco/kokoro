import type { PropertyIteratee } from "./types";

interface DiffResult<T> {
  toAdd: T[];
  toRemove: T[];
  toUpdate: T[];
  toKeep: T[];
}

interface DiffApplyCallbacks<T> {
  onAdd?: (items: T[]) => void | Promise<void>;
  onRemove?: (items: T[]) => void | Promise<void>;
  onUpdate?: (items: T[]) => void | Promise<void>;
  onKeep?: (items: T[]) => void | Promise<void>;
}

interface DiffApplyIndividualCallbacks<T> {
  onAdd?: (item: T) => void | Promise<void>;
  onRemove?: (item: T) => void | Promise<void>;
  onUpdate?: (item: T) => void | Promise<void>;
  onKeep?: (item: T) => void | Promise<void>;
}

/**
 * Applies the results of a diff operation using provided callback functions.
 * Each callback receives the entire list of items for that operation.
 * Operations are executed in a specific order: remove, update, add.
 * This order helps prevent conflicts when applying changes to a data store.
 * Callbacks are only executed if there are items to process.
 *
 * @template T - The type of items being processed
 *
 * @param diffResult - The result of a diff operation
 * @param callbacks - Object containing callback functions for each operation type
 *
 * @returns A promise that resolves when all operations are complete
 *
 * @example
 * ```typescript
 * const diffResult = diff(original, updated, (item) => item.id);
 *
 * await diffApply(diffResult, {
 *   onAdd: (items) => console.log('Adding:', items),
 *   onRemove: (items) => console.log('Removing:', items),
 *   onUpdate: (items) => console.log('Updating:', items),
 *   onKeep: (items) => console.log('Keeping:', items)
 * });
 * ```
 */
export async function diffApply<T>(
  diffResult: DiffResult<T>,
  callbacks: DiffApplyCallbacks<T>,
): Promise<void> {
  const { onAdd, onRemove, onUpdate, onKeep } = callbacks;

  // Execute operations in a specific order: remove, update, add
  // This helps prevent conflicts when applying changes to a data store
  if (onRemove && diffResult.toRemove.length > 0) {
    await onRemove(diffResult.toRemove);
  }

  if (onUpdate && diffResult.toUpdate.length > 0) {
    await onUpdate(diffResult.toUpdate);
  }

  if (onAdd && diffResult.toAdd.length > 0) {
    await onAdd(diffResult.toAdd);
  }

  // Keep operations can be done in parallel with the others
  if (onKeep && diffResult.toKeep.length > 0) {
    await onKeep(diffResult.toKeep);
  }
}

/**
 * Applies the results of a diff operation using provided callback functions.
 * Each callback is called individually for each item in the diff result.
 * Operations are executed in a specific order: remove, update, add.
 * This order helps prevent conflicts when applying changes to a data store.
 * Callbacks are only executed if there are items to process.
 *
 * @template T - The type of items being processed
 *
 * @param diffResult - The result of a diff operation
 * @param callbacks - Object containing callback functions for each operation type
 *
 * @returns A promise that resolves when all operations are complete
 *
 * @example
 * ```typescript
 * const diffResult = diff(original, updated, (item) => item.id);
 *
 * await diffApplyIndividual(diffResult, {
 *   onAdd: (item) => console.log('Adding:', item),
 *   onRemove: (item) => console.log('Removing:', item),
 *   onUpdate: (item) => console.log('Updating:', item),
 *   onKeep: (item) => console.log('Keeping:', item)
 * });
 * ```
 */
export async function diffApplyIndividual<T>(
  diffResult: DiffResult<T>,
  callbacks: DiffApplyIndividualCallbacks<T>,
): Promise<void> {
  const { onAdd, onRemove, onUpdate, onKeep } = callbacks;

  // Execute operations in a specific order: remove, update, add
  // This helps prevent conflicts when applying changes to a data store
  if (onRemove && diffResult.toRemove.length > 0) {
    await Promise.all(diffResult.toRemove.map((item) => onRemove(item)));
  }

  if (onUpdate && diffResult.toUpdate.length > 0) {
    await Promise.all(diffResult.toUpdate.map((item) => onUpdate(item)));
  }

  if (onAdd && diffResult.toAdd.length > 0) {
    await Promise.all(diffResult.toAdd.map((item) => onAdd(item)));
  }

  // Keep operations can be done in parallel with the others
  if (onKeep && diffResult.toKeep.length > 0) {
    await Promise.all(diffResult.toKeep.map((item) => onKeep(item)));
  }
}

/**
 * Applies the results of a diff operation using provided callback functions sequentially.
 * Each callback is called individually for each item in the diff result.
 * Operations are executed in a specific order: remove, update, add.
 * Within each operation type, items are processed one after another, waiting for each promise to resolve.
 * This is useful when operations need to be done in order, such as when updating a database with foreign key constraints.
 *
 * @template T - The type of items being processed
 *
 * @param diffResult - The result of a diff operation
 * @param callbacks - Object containing callback functions for each operation type
 *
 * @returns A promise that resolves when all operations are complete
 *
 * @example
 * ```typescript
 * const diffResult = diff(original, updated, (item) => item.id);
 *
 * await diffApplySequential(diffResult, {
 *   onAdd: (item) => console.log('Adding:', item),
 *   onRemove: (item) => console.log('Removing:', item),
 *   onUpdate: (item) => console.log('Updating:', item),
 *   onKeep: (item) => console.log('Keeping:', item)
 * });
 * ```
 */
export async function diffApplySequential<T>(
  diffResult: DiffResult<T>,
  callbacks: DiffApplyIndividualCallbacks<T>,
): Promise<void> {
  const { onAdd, onRemove, onUpdate, onKeep } = callbacks;

  // Execute operations in a specific order: remove, update, add
  // This helps prevent conflicts when applying changes to a data store
  if (onRemove && diffResult.toRemove.length > 0) {
    for (const item of diffResult.toRemove) {
      await onRemove(item);
    }
  }

  if (onUpdate && diffResult.toUpdate.length > 0) {
    for (const item of diffResult.toUpdate) {
      await onUpdate(item);
    }
  }

  if (onAdd && diffResult.toAdd.length > 0) {
    for (const item of diffResult.toAdd) {
      await onAdd(item);
    }
  }

  // Keep operations can still be done sequentially after the others
  if (onKeep && diffResult.toKeep.length > 0) {
    for (const item of diffResult.toKeep) {
      await onKeep(item);
    }
  }
}

/**
 * Computes the difference between two collections of items, determining which items need to be added,
 * removed, updated, or kept. This is useful for synchronizing data between two sources.
 *
 * @template T - The type of items being compared
 * @template K - The type of the key used to identify items
 *
 * @param original - The original collection of items (array or record)
 * @param toCompare - The new collection of items to compare against
 * @param iteratee - A function that extracts the key from an item for comparison
 * @param shouldUpdate - Optional function to determine if an item needs updating. Defaults to true (every item is updated)
 *
 * @returns A DiffResult object containing arrays of items to add, remove, update, and keep
 *
 * @example
 * ```typescript
 * const original = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
 * const updated = [{ id: 1, name: 'Johnny' }, { id: 3, name: 'Bob' }];
 *
 * const result = diff(
 *   original,
 *   updated,
 *   (item) => item.id,
 *   (original, updated) => original.name !== updated.name
 * );
 *
 * // result.toAdd = [{ id: 3, name: 'Bob' }]
 * // result.toRemove = [{ id: 2, name: 'Jane' }]
 * // result.toUpdate = [{ id: 1, name: 'Johnny' }]
 * // result.toKeep = []
 * ```
 */
export function diff<T, K extends PropertyKey>(
  original: T[] | Record<PropertyKey, T>,
  toCompare: T[] | Record<PropertyKey, T>,
  iteratee: PropertyIteratee<T, K>,
  shouldUpdate?: (original: T, toCompare: T) => boolean,
): DiffResult<T> {
  const result: DiffResult<T> = {
    toAdd: [],
    toRemove: [],
    toUpdate: [],
    toKeep: [],
  };

  // Convert inputs to arrays if they're records
  const originalArray = Array.isArray(original)
    ? original
    : Object.values(original);
  const toCompareArray = Array.isArray(toCompare)
    ? toCompare
    : Object.values(toCompare);

  // Helper function to get the key from an item
  const getKey = (item: T): K => {
    if (typeof iteratee === "function") {
      return iteratee(item);
    }
    return item[iteratee] as K;
  };

  // Create maps for efficient lookup
  const originalMap = new Map(
    originalArray.map((item) => [getKey(item), item]),
  );

  const toCompareMap = new Map(
    toCompareArray.map((item) => [getKey(item), item]),
  );

  // Find items to add or update
  for (const [key, item] of toCompareMap) {
    const existing = originalMap.get(key);
    if (!existing) {
      result.toAdd.push(item);
    } else {
      if (shouldUpdate?.(existing, item) ?? true) {
        result.toUpdate.push(item);
      } else {
        result.toKeep.push(item);
      }
    }
  }

  // Find items to remove
  for (const [key, item] of originalMap) {
    if (!toCompareMap.has(key)) {
      result.toRemove.push(item);
    }
  }

  return result;
}
