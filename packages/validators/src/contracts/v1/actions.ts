import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import { baseActionSchema } from "../../actions";

export const v1ActionsRouter = oc.prefix("/actions").router({
  runAction: oc
    .route({
      path: "/",
      method: "POST",
      description: "Run an action",
    })
    .input(baseActionSchema)
    .output(
      z.object({
        result: z.string(),
      })
    ),
});
