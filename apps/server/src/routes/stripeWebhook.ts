import { Hono } from "hono";

import { handleStripeWebhook } from "@kokoro/stripe";

const stripeWebhook = new Hono();

stripeWebhook.post("/", async (c) => {
  return handleStripeWebhook(c.req.raw);
});

export { stripeWebhook };
