import "./instrumentation.ts";

import { CronJob } from "cron";
import { Hono } from "hono";
import { pinoLogger } from "hono-pino";

import {
  GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE,
  GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE,
  GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE,
  publish,
} from "@kokoro/queues";

import { CONSUMERS } from "./consumers";
import { logger } from "./logger.ts";

type CronFunction = () => void | Promise<void>;

type CronSchedule = Record<string, CronFunction>;

const app = new Hono();

const cronTasks: CronSchedule = {
  "0 * * * *": () => publish(GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE, {}),
  "0,30 * * * *": () => publish(GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE, {}),
  "15,45 * * * *": () => publish(GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE, {}),
};

app.use(
  "*",
  pinoLogger({
    pino: logger,
  }),
);

logger.info("Starting consumers...");

const instancedConsumers = CONSUMERS.map((consumer) => consumer());

logger.info("Consumers started");

logger.info("Starting cron...");

const instancedCronTasks = Object.entries(cronTasks).map(
  ([cronPattern, job]) => {
    return new CronJob(cronPattern, job).start();
  },
);

logger.info("Cron started");

app.get("/", (c) => {
  return c.json({
    status: "ok",
    consumers: instancedConsumers.length,
    cron: instancedCronTasks.length,
  });
});

const port = process.env.PORT ?? 3005;

export default {
  fetch: app.fetch,
  port,
};
