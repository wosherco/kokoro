import type { User } from "@kokoro/db/schema";

export interface ActionContext {
  user: User;
}
