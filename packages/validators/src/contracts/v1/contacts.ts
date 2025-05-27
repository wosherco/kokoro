import { oc } from "@orpc/contract";
import { z } from "zod";

export const v1ContactsRouter = oc.prefix("/contact").router({
  queryContacts: oc
    .route({
      path: "/",
      method: "POST",
      description: "Query contacts",
    })
    .input(
      z
        .object({
          email: z.string().email(),
        })
        .or(
          z.object({
            name: z.string(),
          })
        )
    )
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          links: z.array(
            z.object({
              id: z.string().uuid(),
              source: z.string(),
              photoUrl: z.string().nullable(),
              contactListId: z.string().uuid().nullable(),
              platformContactId: z.string().nullable(),
              platformContactListId: z.string().nullable(),
              platformAccountId: z.string().nullable(),
            })
          ),
          emails: z.array(
            z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              displayName: z.string().nullable(),
              primary: z.boolean(),
              linkId: z.string().uuid(),
            })
          ),
          names: z.array(
            z.object({
              id: z.string().uuid(),
              givenName: z.string().nullable(),
              middleName: z.string().nullable(),
              familyName: z.string().nullable(),
              displayName: z.string().nullable(),
              primary: z.boolean(),
              linkId: z.string().uuid(),
            })
          ),
        })
      )
    ),
});
