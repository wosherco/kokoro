---
title: "Self-hosting Kokoro"
sidebar_position: 3
---

## Self-hosting Kokoro

You can completely self-host Kokoro, so you have all the control over your data.

:::warning
In theory kokoro is fully self-hosted, but currently I'm just a single guy working on this project, so expect some things to be broken. Feel free to open an issue on [GitHub](https://github.com/wosherco/kokoro).
:::

:::important
Kokoro is self-hostable **only** personal use. This also includes not hosting it for others to use.

For commercial usage or business, you must contact us at [contact@kokoro.ws](mailto:contact@kokoro.ws), or use [Kokoro Cloud](create-an-account).

For more information, see the [LICENSE](https://github.com/wosherco/kokoro/blob/main/LICENSE).
:::

## Installation

### Prerequisites

You'll need:

- Docker Engine (w/ Docker Compose)
- Some API keys for the integrations you want to use
- a public domain for external services to reach Kokoro, or ngrok

### Step 1: Get Kokoro's docker-compose.yaml file

You can get the file from [here](https://github.com/wosherco/kokoro/blob/main/docker-compose.yaml).

```bash
curl -O https://raw.githubusercontent.com/wosherco/kokoro/main/docker-compose.yaml
```

For nerds, kokoro uses:

- Postgres
- RabbitMQ

And we have the following services:

- api (using port :3001)
- consumer (using port :3005)
- account (using port :5174)
- authentication (using port :5173)

### Step 2: Create a .env file

You can get the `.env` file from [here](https://github.com/wosherco/kokoro/blob/main/.env.deploy).

```bash
curl -O https://raw.githubusercontent.com/wosherco/kokoro/main/.env.deploy
mv .env.deploy .env
```

### Step 3: Fill in the .env file

Open the `.env` file and fill in the required variables. You can use your favourite text editor, or nano.

```bash
nano .env
```

In this file, for the most, part you can leave the variables as they are. If you go a bit down, you'll find the integration variables. Find instructions for each integration in the [integrations](/integrations) section.

### Step 4: Using ngrok (optional)

If you're going to use ngrok, you'll need to follow these steps:

1. Create a [ngrok](https://ngrok.com/) account
2. Create a free domain [here](https://dashboard.ngrok.com/domains)
3. Get your ngrok token [here](https://dashboard.ngrok.com/get-started/your-authtoken)

Then, fill in the `NGROK` variables in the `.env` file, as well as setting `NGROK_ENABLED` to `true`.

### Step 5: Start the containers

```bash
docker-compose up -d
```

## You're all set

You can now access Kokoro at `https://<your-domain or localhost>:5174`.

## What's next?

- [Using Kokoro](/introduction/using-kokoro)
- [Integrations](/integrations)
