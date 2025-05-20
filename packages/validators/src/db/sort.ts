export const MEMORY_SORT_BY = [
  "relevantDate",
  "createdAt",
  "updatedAt",
  "priority",
] as const;

export type MemorySortBy = (typeof MEMORY_SORT_BY)[number];

export const ORDER_BY = ["asc", "desc"] as const;

export type OrderBy = (typeof ORDER_BY)[number];
