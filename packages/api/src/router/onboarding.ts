import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { userTable } from "@kokoro/db/schema";

import { protectedProcedure } from "../trpc";

export const onboardingRouter = {
  finishFirstStep: protectedProcedure
    .input(
      z.object({
        alias: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { alias } = input;

      await db
        .update(userTable)
        .set({
          alias,
          onboardingStep: 1,
        })
        .where(
          and(eq(userTable.id, ctx.user.id), eq(userTable.onboardingStep, 0)),
        );
    }),

  finishSecondStep: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(userTable)
      .set({
        onboardingStep: 2,
      })
      .where(
        and(eq(userTable.id, ctx.user.id), eq(userTable.onboardingStep, 1)),
      );
  }),
} satisfies TRPCRouterRecord;
