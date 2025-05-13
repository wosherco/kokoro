import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import {
  type BaseActionWithPayload,
  type KokoroActionName,
  baseActionSchema,
  parsePayload,
} from "@kokoro/validators/actions";

import { executeAction } from "../../logic";
import { protectedProcedure } from "../../trpc";

export const v1ActionsRouter = {
  runAction: protectedProcedure
    .input(baseActionSchema)
    .mutation(async ({ ctx, input }) => {
      let parsedAction: BaseActionWithPayload<KokoroActionName>;

      try {
        parsedAction = await parsePayload(input);
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid action",
        });
      }

      const result = await executeAction(
        {
          user: ctx.user,
        },
        parsedAction,
      );

      return {
        result,
      };
    }),
} satisfies TRPCRouterRecord;
