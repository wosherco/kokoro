import { z } from "zod";

export const integrationAccountIdSchema = z
  .string()
  .uuid()
  .describe("The id of the integration account");

export const calendarIdSchema = z
  .string()
  .uuid()
  .describe("The id of the calendar");

export const virtualEventSchema = z.object({
  memoryId: z.string().describe("The id of the memory containing the event."),
  virtualStartDate: z
    .string()
    .nullable()
    .describe(
      "<nullable> IF VIRTUAL ONLY, provide the start date of the virtual event.",
    ),
});

export type VirtualEvent = z.infer<typeof virtualEventSchema>;

export const tasklistIdSchema = z
  .string()
  .uuid()
  .describe("The id of the tasklist");

export const taskIdSchema = z.string().describe("The id of the task");
