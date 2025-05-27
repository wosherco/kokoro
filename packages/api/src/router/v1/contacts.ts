import { queryContacts } from "@kokoro/brain";

import { os, authorizedMiddleware } from "../../orpc";

export const v1ContactsRouter = os.v1.contacts.router({
  queryContacts: os.v1.contacts.queryContacts
    .use(authorizedMiddleware)
    .handler(async ({ context, input }) => {
      const contacts = await queryContacts(
        context.user.id,
        "email" in input
          ? {
              email: input.email,
            }
          : {
              name: input.name,
            },
      );

      return contacts;
    }),
});
