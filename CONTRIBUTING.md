# Contributing to Kokoro

Contributions are welcome! Please read the following guide to help you get started.

:::info
This guide is not finished yet. A ton of details are missing. If you want to contribute, feel free to ask in the [Discord server](https://discord.com/invite/knDFUB5UtU).
:::

## Basic

Install nvm and pnpm. Install the node version in `.nvmrc`.

```sh
nvm install
pnpm install
```

## Ports

- Server: 3001
- Landing: 3002
- Consumer: 3005
- Authenticator: 5173
- Account: 5174
- Docs: 5176
- Developers: 5177

- PostgreSQL: 5432
- RabbitMQ:
  - 5672 (AMQP protocol)
  - 15672 (Management UI) (admin:password)
- Dragonfly: 6379
- Mailpit:
  - 8025 (Web UI)
  - 1025 (SMTP)
- Embedding Service: 5555

## Ngrok

To receive webhooks like google calendar you will need ngrok. (if you just want stripe webhooks you can skip this and check down below)

First create a ngrok account, with a free url.

Then set the env vars from `.env.example`, and when running server, it will use ngrok to get a public url.

## Stripe (not needed at all)

First, create a webhook with the following events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`

Then set the env vars from `.env.example`, and when running server. You will also need to create a webhook.

### Webhook (if not using ngrok)

You will need the stripe CLI.

```sh
stripe login
```

Then run the following command to create the webhook:

```sh
stripe listen --forward-to http://localhost:3001/webhooks/stripe
```
