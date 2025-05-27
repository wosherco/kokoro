import { oc } from "@orpc/contract";
import { z } from "zod/v4";

export const v1TasklistsRouter = oc.prefix("/tasklist").router({
  getTasklist: oc
    .route({
      path: "/{tasklistId}",
      method: "GET",
      description: "Get a tasklist",
    })
    .input(
      z.object({
        tasklistId: z.uuid(),
      })
    )
    .output(
      z.object({
        prompt: z.string(),
        tasklist: z.object({
          id: z.uuid(),
          integrationAccountId: z.uuid(),
          platformAccountId: z.string(),
          platformTaskListId: z.string(),
          source: z.string(),

          name: z.string(),
          config: z.any(),

          color: z.string().nullable(),
          colorOverride: z.string().nullable(),

          lastSynced: z.string().nullable(),
        }),
      })
    ),
});
