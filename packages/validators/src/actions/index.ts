import { z } from "zod";

import { CalendarActionSchemas, CalendarActions } from "./calendar";
import { TasksActionSchemas, TasksActions } from "./tasks";

export type { VirtualEvent } from "./common";

export type BaseSchema = Record<string, unknown>;

// exports of all actions and related stuff
export const KokoroActions = [...CalendarActions, ...TasksActions] as const;
export type KokoroActionName = (typeof KokoroActions)[number];
export const KokoroActionPayloadSchemas = {
  ...CalendarActionSchemas,
  ...TasksActionSchemas,
} as const;
export const allActionNamesAsStringArray = KokoroActions.map(
  (name) => name
) as string[];

// exports of individual actions
export * from "./calendar";
export * from "./tasks";

/**
 * Utils to get the types of a payload based on the action name
 */
export type ActionPayload<Name extends KokoroActionName> = z.infer<
  (typeof KokoroActionPayloadSchemas)[Name]
>;

export const baseActionSchema = z.object({
  name: z.enum(KokoroActions),
  payload: z.record(z.string(), z.unknown()),
});

export type BaseAction = z.infer<typeof baseActionSchema>;

export interface BaseActionWithPayload<ActionName extends KokoroActionName> {
  name: ActionName;
  payload: ActionPayload<ActionName>;
}

// Implementation
export async function parsePayload<
  ActionName extends KokoroActionName
>(action: {
  name: ActionName;
  payload: BaseAction["payload"];
}): Promise<BaseActionWithPayload<ActionName>> {
  const schema = KokoroActionPayloadSchemas[action.name];

  const parsedPayload = await schema.parseAsync(action.payload);

  return {
    ...action,
    payload: parsedPayload,
  };
}
