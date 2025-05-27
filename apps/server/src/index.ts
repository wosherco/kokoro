import "./instrumentation.ts";

import ngrok from "@ngrok/ngrok";
import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { cors } from "hono/cors";

import { appRouter, createContext } from "@kokoro/api";

import { env } from "./env";
import { logger } from "./logger.ts";
import { stripeWebhook } from "./routes/stripeWebhook";
import { watchGoogleCalendar } from "./routes/watch/googleCalendar";
import { linearWebhook } from "./routes/webhooks/linear.ts";

import { RPCHandler } from "@orpc/server/fetch";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { experimental_ZodSmartCoercionPlugin as ZodSmartCoercionPlugin } from "@orpc/zod/zod4"; // <-- zod v4
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { v1OauthRouter } from "./routes/v1/index.ts";

const app = new Hono();

app.use(
  "*",
  pinoLogger({
    pino: logger,
  })
);

app.use(
  "*",
  cors({
    origin: [
      env.PUBLIC_ACCOUNT_URL,
      env.PUBLIC_APP_URL,
      env.PUBLIC_AUTHENTICATOR_URL,
      env.PUBLIC_LANDING_URL,
      env.PUBLIC_DEVELOPERS_URL,
    ],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

const orpcHandler = new RPCHandler(appRouter);

app.use("/rpc/*", async (c, next) => {
  const context = await createContext(c.req.raw.headers);

  const { matched, response } = await orpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

const openApiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new ZodSmartCoercionPlugin(),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "Kokoro Developer API",
          version: "1.0.0",
        },
      },
      specPath: "/openapi.json",
      docsPath: "/docs",
    }),
  ],
});

app.use("/v1/*", async (c, next) => {
  const context = await createContext(c.req.raw.headers);

  const { matched, response } = await openApiHandler.handle(c.req.raw, {
    prefix: "/v1",
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.route("/v1", v1OauthRouter);

app.route("/watch/google-calendar", watchGoogleCalendar);

app.route("/webhooks/stripe", stripeWebhook);

app.route("/webhooks/linear", linearWebhook);

const port = process.env.PORT ?? 3001;

if (env.NGROK_ENABLED) {
  ngrok
    .connect({
      authtoken: env.NGROK_AUTHTOKEN,
      addr: port,
      domain: env.NGROK_URL,
    })
    .then((listener) => {
      logger.info(`Ngrok listening on ${listener.url()}`);
    })
    .catch((err) => {
      logger.error("Failed to connect to ngrok", err);
    });
}

export default {
  fetch: app.fetch,
  port,
};
