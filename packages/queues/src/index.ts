import * as Sentry from "@sentry/bun";
import type { Consumer, Publisher } from "rabbitmq-client";
import { Connection } from "rabbitmq-client";
import { z } from "zod";

import { env } from "../env";
import type { Queue, QueueMessageMap } from "./queues";
import { QueueSchemaMap } from "./queues";

export type { Consumer } from "rabbitmq-client";

export * from "./queues";

const context: Partial<
  Record<
    Queue,
    {
      publisher: Publisher;
    }
  >
> = {};

let connectionCache: Connection | null = null;

function getConnection() {
  if (connectionCache) {
    return connectionCache;
  }

  connectionCache = new Connection(env.RABBITMQ_URL);

  connectionCache.on("error", (error) => {
    console.error("RabbitMQ connection error:", error);
  });

  connectionCache.on("connection", () => {
    console.warn("RabbitMQ connection opened");
  });

  return connectionCache;
}

function getPublisher(queue: Queue) {
  if (context[queue]) {
    return context[queue].publisher;
  }

  const publisher = getConnection().createPublisher({
    confirm: true,
    queues: [
      {
        queue,
      },
    ],
  });

  context[queue] = { publisher };

  return publisher;
}

const queuedMessageSchema = z.object({
  retries: z.number(),
  data: z.any(),
});

type QueuedMessage = z.infer<typeof queuedMessageSchema>;

export async function publish<Q extends Queue>(
  queue: Q,
  message: QueueMessageMap[Q],
) {
  const payload = {
    retries: 0,
    data: message,
  } satisfies QueuedMessage;

  await internalPublish(queue, payload);
}

async function internalPublish<Q extends Queue>(
  queue: Q,
  message: QueuedMessage,
) {
  const publisher = getPublisher(queue);
  await publisher.send(queue, JSON.stringify(message));
}

// TODO: Add tracers
export function consume<Q extends Queue>(
  queue: Q,
  handler: (message: QueueMessageMap[Q]) => Promise<void>,
): Consumer {
  const connection = getConnection();

  const consumer = connection.createConsumer(
    {
      queue,
      concurrency: 2,
      requeue: false,
    },
    async (msg) => {
      console.info({ msg }, "Received message");
      let payload: QueuedMessage;

      try {
        payload = queuedMessageSchema.parse(JSON.parse(String(msg.body)));
      } catch (error) {
        console.error({ error }, "Failed to parse message body");

        Sentry.captureException(error, {
          tags: {
            queue,
          },
        });

        return;
      }

      console.info({ payload }, "Parsed message body");

      let content: QueueMessageMap[Q];

      try {
        content = QueueSchemaMap[queue].parse(
          payload.data,
        ) as QueueMessageMap[Q];
      } catch (error) {
        console.error({ error }, "Failed to parse message body");

        Sentry.captureException(error, {
          tags: {
            queue,
          },
        });

        return;
      }

      try {
        await handler(content);
      } catch (error) {
        console.error(error);
        console.error({ error }, "Failed to handle message");
        const shouldRepublish = payload.retries < 3;

        Sentry.captureException(error, {
          tags: {
            queue,
            republish: shouldRepublish,
          },
        });

        if (shouldRepublish) {
          console.info({ content }, "Republishing message");
          await internalPublish(queue, {
            retries: payload.retries + 1,
            data: content,
          });
        }
      }

      console.info("Message handled!");
    },
  );

  // When stopping the server, we need to close the consumer
  for (const signal of ["SIGINT", "SIGTERM", "SIGQUIT"]) {
    process.on(signal, () => {
      console.log("Closing RabbitMQ consumer");
      void consumer.close().then(() => {
        console.log("RabbitMQ consumer closed");
      });
    });
  }

  return consumer;
}
