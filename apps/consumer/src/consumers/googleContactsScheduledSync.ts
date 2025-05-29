import { and, eq, gt, isNotNull } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { integrationsAccountsTable, userTable } from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import {
  CONTACTS_SYNC_QUEUE,
  GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE,
  consume,
  publish,
} from "@kokoro/queues";
import { GOOGLE_PEOPLE } from "@kokoro/validators/db";

import { env } from "../env";

export const googleContactsScheduledSync = (): Consumer =>
  consume(GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE, async () => {
    const accounts = await db
      .select({
        id: integrationsAccountsTable.id,
        googleAccountId: integrationsAccountsTable.platformAccountId,
      })
      .from(integrationsAccountsTable)
      .innerJoin(userTable, eq(userTable.id, integrationsAccountsTable.userId))
      .where(
        and(
          env.PUBLIC_STRIPE_ENABLED
            ? and(
                isNotNull(userTable.subscribedUntil),
                gt(userTable.subscribedUntil, new Date())
              )
            : undefined,
          eq(integrationsAccountsTable.integrationType, GOOGLE_PEOPLE)
        )
      );

    console.info(
      "[googleContactsScheduledSync] Publishing syncs",
      accounts.length
    );

    const promises: Promise<void>[] = [];

    for (const account of accounts) {
      const publishPromise = publish(CONTACTS_SYNC_QUEUE, {
        integrationAccountId: account.id,
        source: GOOGLE_PEOPLE,
      });

      void publishPromise;

      promises.push(publishPromise);
    }

    await Promise.all(promises);
  });
