import "./instrumentation.ts";

import ngrok from "@ngrok/ngrok";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter, createContext } from "@kokoro/api";

import { env } from "./env";
import { stripeWebhook } from "./routes/stripeWebhook";
import { watchGoogleCalendar } from "./routes/watch/googleCalendar";
import { linearWebhook } from "./routes/webhooks/linear.ts";

import { isDev } from "@kokoro/consts";
import { OAUTH_SCOPES, OAUTH_SCOPES_MAP } from "@kokoro/validators/db";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodSmartCoercionPlugin, ZodToJsonSchemaConverter } from "@orpc/zod";
import { captureException, logger } from "@sentry/bun";
import { v1OauthRouter } from "./routes/v1/index.ts";

const app = new Hono();

app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  logger.info("Received request", {
    url: c.req.url,
    method: c.req.method,
    headers: c.req.header(),
    requestId,
  });

  try {
    await next();
  } catch (error) {
    logger.error("Request failed", {
      url: c.req.url,
      method: c.req.method,
      headers: c.req.header(),
      error,
    });

    captureException(error, {
      tags: {
        requestId,
      },
    });

    return c.newResponse(
      `Internal Server Error. Request id: ${requestId}`,
      500,
    );
  }

  logger.info("Request completed", {
    requestId,
  });
});

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
  }),
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

const openApiHandler = new OpenAPIHandler(appRouter.v1, {
  plugins: [
    new ZodSmartCoercionPlugin(),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "Kokoro Developer API",
          version: "1.0.0",
          description:
            "The Kokoro Developer API is a REST API that allows you to interact with the Kokoro platform.",
        },
        servers: [
          {
            url: isDev
              ? "http://localhost:3001/v1"
              : "https://api.kokoro.ws/v1",
          },
        ],
        exclude(procedure) {
          // If no path, means we haven't specified it, which means it's not part of the rest api
          return !procedure["~orpc"].route.path;
        },
        components: {
          securitySchemes: {
            oauth2: {
              type: "oauth2",
              flows: {
                authorizationCode: {
                  authorizationUrl: isDev
                    ? "http://localhost:5173/authorize"
                    : "https://auth.kokoro.ws/authorize",
                  tokenUrl: isDev
                    ? "http://localhost:3001/v1/oauth/token"
                    : "https://api.kokoro.ws/v1/oauth/token",
                  scopes: OAUTH_SCOPES_MAP,
                  // @ts-expect-error This is for Scalar, the UI we expose for exploring the API
                  "x-scalar-client-id": isDev
                    ? "EN25N8EL9N-uXyCYiuWVQ"
                    : "g8rg9N0g9k50Dug4gsU-n",
                  selectedScopes: OAUTH_SCOPES,
                  "x-usePkce": "SHA-256",
                },
              },
            },
          },
        },
        security: [
          {
            oauth2: [],
          },
        ],
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
