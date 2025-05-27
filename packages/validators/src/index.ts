import { z } from "zod";

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

export type Callback = () => Promise<void> | void;
