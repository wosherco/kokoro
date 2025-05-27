import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import { INTEGRATION_TYPES, INTEGRATIONS } from "../../db";
import { v1IntegrationsLinearRouter } from "./integrations/linear";

export const v1IntegrationsRouter = oc.prefix("/integrations").router({
  listIntegrations: oc
    .route({
      path: "/",
      method: "GET",
      description: "List all integrations",
    })
    .output(
      z.array(
        z.object({
          id: z.uuid(),
          integrationType: z.enum(INTEGRATIONS),
          displayName: z.string(),
          calendars: z.array(
            z.object({
              id: z.uuid(),
              summary: z.string().nullable(),
              summaryOverride: z.string().nullable(),
              description: z.string().nullable(),
              colorOverride: z.string().nullable(),
              color: z.string().nullable(),
              hidden: z.boolean(),
            })
          ),
          tasklists: z.array(
            z.object({
              id: z.uuid(),
              name: z.string(),
              colorOverride: z.string().nullable(),
              color: z.string().nullable(),
              hidden: z.boolean(),
            })
          ),
          supports: z.array(z.enum(INTEGRATION_TYPES)),
        })
      )
    ),

  queueAccountSync: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  toggleCalendarVisibility: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
        calendarId: z.uuid(),
        hidden: z.boolean(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  changeCalendarColor: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
        calendarId: z.uuid(),
        color: z.string(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  queueCalendarSync: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
        calendarId: z.uuid(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  toggleTasklistVisibility: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
        tasklistId: z.uuid(),
        hidden: z.boolean(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  changeTasklistColor: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
        tasklistId: z.uuid(),
        color: z.string(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  queueTasklistSync: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
        tasklistId: z.uuid(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  deleteAccount: oc
    .input(
      z.object({
        integrationAccountId: z.uuid(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  linear: v1IntegrationsLinearRouter,
});
