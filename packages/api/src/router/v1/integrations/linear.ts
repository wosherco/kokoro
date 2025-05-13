import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { linearWebhooksTable } from "@kokoro/db/schema";
import { LINEAR } from "@kokoro/validators/db";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedIntegrationProcedure } from "../../../trpc";

export const v1IntegrationsLinearRouter = {
  getWebhookStatus: protectedIntegrationProcedure.query(async ({ ctx }) => {
    const { integrationAccount } = ctx;

    if (
      integrationAccount.integrationType !== LINEAR ||
      !integrationAccount.platformData ||
      !("workspaceId" in integrationAccount.platformData)
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid integration",
      });
    }

    const [webhook] = await db
      .select()
      .from(linearWebhooksTable)
      .where(
        eq(
          linearWebhooksTable.workspaceId,
          integrationAccount.platformData.workspaceId,
        ),
      );

    if (!webhook) {
      return {
        status: "not_created",
      } as const;
    }

    return {
      status: webhook.state,
    } as const;
  }),
  setupWebhook: protectedIntegrationProcedure
    .input(
      z.object({
        webhookSecret: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { integrationAccount } = ctx;

      if (
        integrationAccount.integrationType !== LINEAR ||
        !integrationAccount.platformData ||
        !("workspaceId" in integrationAccount.platformData)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Integration is invalid. Make sure it's linear, or try re-authenticating.",
        });
      }

      await db
        .insert(linearWebhooksTable)
        .values({
          workspaceId: integrationAccount.platformData.workspaceId,
          secret: input.webhookSecret,
        })
        .onConflictDoUpdate({
          target: [linearWebhooksTable.workspaceId],
          set: {
            secret: input.webhookSecret,
            state: "unknown",
          },
        });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
