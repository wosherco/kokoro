import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { queryContacts } from "@kokoro/brain";

import { protectedProcedure } from "../../trpc";

export const v1ContactsRouter = {
  queryContacts: protectedProcedure
    .input(
      z
        .object({
          email: z.string().email(),
        })
        .or(
          z.object({
            name: z.string(),
          }),
        ),
    )
    .query(async ({ ctx, input }) => {
      const contacts = await queryContacts(
        ctx.user.id,
        "email" in input
          ? {
              email: input.email,
            }
          : {
              name: input.name,
            },
      );

      return contacts;
    }),
} satisfies TRPCRouterRecord;
