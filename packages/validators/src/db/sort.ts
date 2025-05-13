export const MEMORY_SORT_BY = [
  "similarity",
  "relevantDate",
  "lastUpdate",
  "createdAt",
  "priority",
] as const;

export type MemorySortBy = (typeof MEMORY_SORT_BY)[number];
