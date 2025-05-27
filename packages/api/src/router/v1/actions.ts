import {
  type BaseActionWithPayload,
  type KokoroActionName,
  parsePayload,
} from "@kokoro/validators/actions";

import { ORPCError } from "@orpc/server";
import { executeAction } from "../../logic";
import { os, authorizedMiddleware } from "../../orpc";

export const v1ActionsRouter = os.v1.actions.router({
  runAction: os.v1.actions.runAction
    .use(authorizedMiddleware)
    .handler(async ({ context, input }) => {
      let parsedAction: BaseActionWithPayload<KokoroActionName>;

      try {
        parsedAction = await parsePayload(input);
      } catch (error) {
        console.error(error);
        throw new ORPCError("BAD_REQUEST");
      }

      const result = await executeAction(
        {
          user: context.user,
        },
        parsedAction,
      );

      return {
        result,
      };
    }),
});
