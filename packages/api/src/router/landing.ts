import { ORPCError } from "@orpc/server";
import { env } from "../../env";
import { os } from "../orpc";

export const landingRouter = os.landing.router({
  contact: os.landing.contact.handler(async ({ input }) => {
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
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return {
      success: true,
    };
  }),
});
