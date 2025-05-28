import { oc } from "@orpc/contract";
import { z } from "zod";
import { INTEGRATIONS, INTEGRATION_TYPES } from "../../db";
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
          id: z.string().uuid(),
          integrationType: z.enum(INTEGRATIONS),
          displayName: z.string(),
          calendars: z.array(
            z.object({
              id: z.string().uuid(),
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
              id: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
        calendarId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
        calendarId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
        calendarId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
        tasklistId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
        tasklistId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
        tasklistId: z.string().uuid(),
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
        integrationAccountId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        success: z.literal(true),
      })
    ),

  linear: v1IntegrationsLinearRouter,
});
