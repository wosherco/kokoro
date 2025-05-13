import { z } from "zod";

export function uniqueArray<
  // biome-ignore lint/suspicious/noExplicitAny: just imitating zod
  Output = any,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(schema: z.ZodType<Output, Def, Input>) {
  return z
    .array(schema)
    .refine((items) => new Set(items).size === items.length, {
      message: "All items must be unique, no duplicate values allowed",
    });
}

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z
    .string()
    .email("Invalid email address")
    .max(200, "Email is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message is too long"),
});

export type ContactSchema = z.infer<typeof contactSchema>;

// export const ReminderSchema = z.object({
//   id: z.string(),
//   data: z
//     .object({
//       description: z.string(),
//       time: z.string().describe("ISO 8601"),
//     })
//     .optional(),
// });

// export const uiCardSchema = z.object({
//   title: z.string().describe("The title of the card"),
//   description: z
//     .string()
//     .nullable()
//     .describe("<nullable> The description of the card"),
//   list: z
//     .array(
//       z.object({
//         title: z.string(),
//         description: z.string().nullable(),
//       }),
//     )
//     .describe("A list of items to display in the card"),
// });

// export type UICard = z.infer<typeof uiCardSchema>;

// const baseContextSchema = z
//   .object({
//     actions: z.array(clientActionSchema),
//     selectedMemories: z.array(
//       z.object({
//         id: z.string().uuid(),
//         instanceDate: z.string().optional(),
//       }),
//     ),
//   })
//   .partial();

// export const clientMessageSchema = z.union([
//   z
//     .object({
//       type: z.literal("text"),
//       data: z.string(),
//     })
//     .and(baseContextSchema),
//   z.object({
//     type: z.literal("start-audio"),
//     data: z.null(),
//     sampleRate: z.number().default(16000),
//     channels: z.number().default(1),
//     bitDepth: z.number().default(16),
//   }),
//   z.object({
//     type: z.literal("audio"),
//     data: z.array(z.number()),
//   }),
//   z
//     .object({
//       type: z.literal("end-audio"),
//       data: z.null(),
//     })
//     .and(baseContextSchema),
//   z.object({
//     type: z.literal("cancel-audio"),
//     data: z.null(),
//   }),
//   z.object({
//     type: z.literal("end"),
//     data: z.null(),
//   }),
// ]);

// export type ClientMessage = z.infer<typeof clientMessageSchema>;

// export const serverMessageSchema = z
//   .object({
//     transcript: z.string(),
//     skills: z.array(z.string()),
//     stream: z.string(),
//     newStream: z.string(),
//     endStream: z.boolean(),
//     actions: z.array(clientActionSchema),
//     actionStates: z.array(
//       z.object({
//         id: z.string().uuid(),
//         state: actionStateSchema,
//       }),
//     ),
//   })
//   .partial();

// export type ServerMessage = z.infer<typeof serverMessageSchema>;

export type Callback = () => Promise<void> | void;
