import type { TaskSource } from "@kokoro/validators/db";
import { LINEAR } from "@kokoro/validators/db";

import { LinearTaskSource } from "./linear";

export { ReadWriteTaskSource, ReadOnlyTaskSource } from "./base";

const TASK_SOURCES = {
  [LINEAR]: new LinearTaskSource(),
} as const;

export function getTaskSource<T extends TaskSource>(
  source: T,
): (typeof TASK_SOURCES)[T] {
  return TASK_SOURCES[source];
}
