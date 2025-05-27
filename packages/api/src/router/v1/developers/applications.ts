import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { oauthClientTable } from "@kokoro/db/schema";
import { ORPCError } from "@orpc/server";
import { nanoid } from "nanoid";
import {
  os,
  authorizedMiddleware,
  protectedOauthApplicationMiddleware,
} from "../../../orpc";

export const v1DevelopersApplicationsRouter =
  os.v1.developers.applications.router({
    create: os.v1.developers.applications.create
      .use(authorizedMiddleware)
      .handler(async ({ context, input }) => {
        const [application] = await db
          .insert(oauthClientTable)
          .values({
            name: input.name,
            ownerId: context.user.id,
            clientId: nanoid(),
            clientSecret: nanoid(40),
          })
          .returning({
            id: oauthClientTable.id,
            name: oauthClientTable.name,
          });

        if (!application) {
          throw new ORPCError("INTERNAL_SERVER_ERROR");
        }

        return {
          id: application.id,
          name: application.name,
        };
      }),

    updateRedirectUris: os.v1.developers.applications.updateRedirectUris
      .use(protectedOauthApplicationMiddleware)
      .handler(async ({ input }) => {
        const [updated] = await db
          .update(oauthClientTable)
          .set({
            redirectUris: input.redirectUris,
          })
          .where(eq(oauthClientTable.id, input.applicationId))
          .returning({
            redirectUris: oauthClientTable.redirectUris,
          });

        if (!updated) {
          throw new ORPCError("INTERNAL_SERVER_ERROR");
        }

        return updated;
      }),
  });
