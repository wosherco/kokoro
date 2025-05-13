export * from "./groupBy";
export * from "./filter";
export * from "./isNil";
export * from "./diff";
export * from "./keyBy";
export * from "./lookup";
export * from "./cases";
export * from "./string";

/**
 * Turns all object properties into the property | undefined | null
 *
 * undefined: not modified
 * null: remove property
 */
export type Modifiable<T> = {
  [K in keyof T]: T[K] | undefined | null;
};
