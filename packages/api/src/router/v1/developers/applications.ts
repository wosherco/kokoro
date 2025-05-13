import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { oauthClientTable } from "@kokoro/db/schema";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  protectedApiAccessProcedure,
  protectedOauthApplicationProcedure,
} from "../../../trpc";

export const v1DevelopersApplicationsRouter = {
  create: protectedApiAccessProcedure
    .input(
      z.object({
        name: z.string().min(5).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [application] = await db
        .insert(oauthClientTable)
        .values({
          name: input.name,
          ownerId: ctx.user.id,
          clientId: nanoid(),
          clientSecret: nanoid(40),
        })
        .returning({
          id: oauthClientTable.id,
          name: oauthClientTable.name,
        });

      if (!application) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return {
        id: application.id,
        name: application.name,
      };
    }),

  updateRedirectUris: protectedOauthApplicationProcedure
    .input(
      z.object({
        redirectUris: z.array(
          z
            .string()
            .url()
            .refine(
              (url) => {
                try {
                  const parsed = new URL(url);
                  return (
                    parsed.protocol === "https:" || parsed.protocol === "http:"
                  );
                } catch {
                  return false;
                }
              },
              { message: "Invalid redirect URI format" },
            ),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(oauthClientTable)
        .set({
          redirectUris: input.redirectUris,
        })
        .where(eq(oauthClientTable.id, input.applicationId))
        .returning({
          redirectUris: oauthClientTable.redirectUris,
        });

      if (!updated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return updated;
    }),
} satisfies TRPCRouterRecord;
