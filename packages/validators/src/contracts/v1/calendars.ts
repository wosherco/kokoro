import { oc } from "@orpc/contract";
import { z } from "zod";

export const v1CalendarsRouter = oc.prefix("/calendar").router({
  getCalendar: oc
    .route({
      path: "/{calendarId}",
      method: "GET",
      description: "Get a calendar",
    })
    .input(
      z.object({
        calendarId: z.string().uuid(),
      })
    )
    .output(
      z.object({
        prompt: z.string(),
        calendar: z.object({
          id: z.string().uuid(),
          integrationAccountId: z.string().uuid(),
          platformCalendarId: z.string(),
          platformAccountId: z.string(),

          summary: z.string().nullable(),
          summaryOverride: z.string().nullable(),
          source: z.string(),
          description: z.string().nullable(),
          color: z.string().nullable(),
          colorOverride: z.string().nullable(),
          timeZone: z.string().nullable(),
          platformData: z.any(),

          lastSynced: z
            .string()
            .datetime({
              offset: true,
            })
            .nullable(),

          createdAt: z.string().datetime({
            offset: true,
          }),
          updatedAt: z.string().datetime({
            offset: true,
          }),
        }),
      })
    ),
});
