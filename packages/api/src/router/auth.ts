import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { invalidateSession } from "@kokoro/auth";

import { protectedProcedure } from "../trpc";

export const authRouter = {
  getUser: protectedProcedure
    .output(
      z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
        profilePicture: z.string().nullable(),
      }),
    )
    .query(({ ctx }) => {
      return {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
        profilePicture: ctx.user.profilePicture,
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await invalidateSession(ctx.session.id);
  }),
} satisfies TRPCRouterRecord;
