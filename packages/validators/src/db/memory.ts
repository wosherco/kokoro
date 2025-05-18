export const EVENT_MEMORY_TYPE = "event";
export const TASK_MEMORY_TYPE = "task";

export const MEMORY_TYPES = [EVENT_MEMORY_TYPE, TASK_MEMORY_TYPE] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];
