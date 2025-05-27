import { oc } from "@orpc/contract";
import { z } from "zod/v4";

export const v1DevelopersApplicationsRouter = oc.router({
  create: oc
    .input(
      z.object({
        name: z.string().min(5).max(100),
      }),
    )
    .output(
      z.object({
        id: z.uuid(),
        name: z.string(),
      }),
    ),

  updateRedirectUris: oc
    .input(
      z.object({
        applicationId: z.uuid(),
        redirectUris: z.array(
          z.url({
            protocol: /^(https|http)$/,
          }),
        ),
      }),
    )
    .output(
      z.object({
        redirectUris: z.array(z.url()),
      }),
    ),
});
