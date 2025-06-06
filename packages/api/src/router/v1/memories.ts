import { getMemories, queryMemories } from "@kokoro/brain";

import { handleDateOrDatetime } from "@kokoro/common/utils";
import { ORPCError } from "@orpc/server";
import { os, authorizedMiddleware } from "../../orpc";

export const v1MemoriesRouter = os.v1.memories.router({
  queryMemories: os.v1.memories.queryMemories
    .use(authorizedMiddleware)
    .handler(async ({ context, input }) => {
      try {
        const memories = await queryMemories(context.user.id, {
          textQuery: input.textQuery,
          dateFrom: input.dateFrom
            ? handleDateOrDatetime(input.dateFrom, true)
            : undefined,
          dateTo: input.dateTo
            ? handleDateOrDatetime(input.dateTo, false)
            : undefined,
          integrationAccountIds: input.integrationAccountIds,
          calendarIds: input.calendarIds,
          tasklistIds: input.tasklistIds,

          taskStates: input.taskStates ? new Set(input.taskStates) : undefined,
          sortBy: input.sortBy,
          orderBy: input.orderBy,
        });
        return memories;
      } catch (error) {
        console.error("error", error);

        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }
    }),

  getMemories: os.v1.memories.getMemories
    .use(authorizedMiddleware)
    .handler(async ({ context, input }) => {
      const memories = await getMemories(context.user.id, input.memoryIds);

      return memories;
    }),
});
