# Kokoro Queues

The idea is to move to `Socketless` some time in the future (hopefully soon).

Currently, we use RabbitMQ to publish and subscribe to messages.

## How to create a queue

1. Create a new file in the `src/queues` directory. (follow same patterns as the existing ones)
2. Add it to the `QUEUES` and `QueueSchemaMap` arrays inside `queues/index.ts`. (this will require importing the name and the schema)
3. Add the export to the `index.ts` file. (`export * from "./your-queue"`)

That's it!

## How to consume a queue

1. Go to `apps/consumer`
2. Create a consumer on `src/queues` (follow the existing patterns)
3. Add it to the `CONSUMERS` array inside `src/consumers/index.ts`

That's it!
