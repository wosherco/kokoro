import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { contactSchema } from "@kokoro/validators";

import { env } from "../../env";
import { publicProcedure } from "../trpc";

export const landingRouter = {
  contact: publicProcedure.input(contactSchema).mutation(async ({ input }) => {
    const { name, email, message } = input;

    if (!env.DISCORD_WEBHOOK_CONTACT_URL) {
      return {
        success: false,
      };
    }

    const webhookData = {
      content: message,
      embeds: [
        {
          title: `New message from ${name} (${email})`,
          color: 5814783,
        },
      ],
      attachments: [],
    };

    const req = await fetch(env.DISCORD_WEBHOOK_CONTACT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    });

    if (!req.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send message to Discord",
      });
    }

    return {
      success: true,
    };
  }),
} satisfies TRPCRouterRecord;
