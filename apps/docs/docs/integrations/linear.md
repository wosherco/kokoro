---
title: "Linear"
---

Sync your Linear issues with Kokoro.

|         | Events | Tasks | People |
| ------- | ------ | ----- | ------ |
| Syncing | ❌     | ✅    | ✅     |
| Mutate  | ❌     | ✅    | ❌     |

## Setting up Webhook (syncing)

On Linear webhooks are attached to the workspace/organization, not the user. For this reason, it needs to be configured on the organization level. If someone already configured it, you don't need to do anything.

To create a webhook on an organization, you need admin permissions. If you don't have it, ask your organization admin to create it for you (link this page to them).

1. Head over to **Settings**.
2. You should see a section called **Administration**, and inside it a page called **API**.

   ![Linear Settings](/cdn/integrations/linear/linear-settings-nav.png)

3. In the **API** page, you should see a section called **Webhooks**. Click on the **+** button to create a new webhook.

   ![Linear Settings](/cdn/integrations/linear/linear-api-settings-page.png)

4. Enter a name for the webhook. You'll find the URL on Kokoro's account dashboard (don't worry, this url is unique per linear organization). On "Data change events", we just currently support `Issues` and `Users`. Adding more won't do anything, and adding less will break the sync.

   ![Linear Settings](/cdn/integrations/linear/linear-api-settings-page.png)

5. Before creating the webhook, make sure you copy the **Signing secret**, and set it on Kokoro's account dashboard.
6. Click on **Create webhook**.

In theory you should be all set. For now, you will see on Kokoro's account dashboard that the state is in yellow, which means pending. The next time we sync, if everything goes well, the state will turn green. If not, it will be red, and you'll get notified.

## Setup for Self-hosting

:::info

TODO

:::
