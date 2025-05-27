import { oc } from "@orpc/contract";
import { z } from "zod";

export const v1DevelopersApplicationsRouter = oc.router({
  create: oc
    .input(
      z.object({
        name: z.string().min(5).max(100),
      }),
    )
    .output(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    ),

  updateRedirectUris: oc
    .input(
      z.object({
        applicationId: z.string().uuid(),
        redirectUris: z.array(
          z
            .string()
            .url()
            .refine((url) =>
              (() => {
                try {
                  const parsedUrl = new URL(url);
                  return (
                    parsedUrl.protocol === "https:" ||
                    (parsedUrl.protocol === "http:" &&
                      parsedUrl.hostname === "localhost")
                  );
                } catch {
                  return false;
                }
              })(),
            ),
        ),
      }),
    )
    .output(
      z.object({
        redirectUris: z.array(z.string().url()),
      }),
    ),
});
