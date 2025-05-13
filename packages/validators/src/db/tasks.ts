export const TODO = "TODO";
export const IN_PROGRESS = "IN_PROGRESS";
export const STALLED = "STALLED";
export const COMPLETED = "COMPLETED";

export const TASK_STATES = [TODO, IN_PROGRESS, STALLED, COMPLETED] as const;

export type TaskState = (typeof TASK_STATES)[number];

export type PlatformAttributeId = string;
export type PlatformTagId = string;

export interface TaskListAttribute {
  name: string;
  tags: Record<
    PlatformTagId,
    {
      name?: string;
      color?: string;

      // Not really used rn
      priority?: number;
      // Not really used rn
      state?: TaskState;
    }
  >;
}

export type TaskListConfig = Record<PlatformAttributeId, TaskListAttribute>;

export const KOKORO_TASK_LIST_CONFIG: TaskListConfig = {
  state: {
    name: "State",
    tags: {
      [TODO]: {
        name: "Todo",
        color: "#FF0000",
        state: TODO,
      },
      [IN_PROGRESS]: {
        name: "In Progress",
        color: "#00FF00",
        state: IN_PROGRESS,
      },
      [STALLED]: {
        name: "Stalled",
        color: "#FFA500",
        state: STALLED,
      },
      [COMPLETED]: {
        name: "Completed",
        color: "#008000",
        state: COMPLETED,
      },
    },
  },
} as const;

export const EMPTY_TASK_LIST_CONFIG: TaskListConfig = {} as const;
