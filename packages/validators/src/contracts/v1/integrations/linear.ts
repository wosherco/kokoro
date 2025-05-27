import { oc } from "@orpc/contract";
import { z } from "zod";

// TODO: DUPLCIATED FROM DB SCHEMA. SHOUDL DEDUPLICATE IN THE NEAR FUTURE.
const LINEAR_WEBHOOK_STATE = [
  "unknown",
  "active",
  "invalid",
  // This one below is not duplicated
  "not_created",
] as const;

export const v1IntegrationsLinearRouter = oc.router({
  getWebhookStatus: oc
    .input(
      z.object({
        integrationAccountId: z.string(),
      })
    )
    .output(
      z.object({
        status: z.enum(LINEAR_WEBHOOK_STATE),
      })
    ),

  setupWebhook: oc
    .input(
      z.object({
        integrationAccountId: z.string(),
        webhookSecret: z.string(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),
});
