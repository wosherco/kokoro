import { oc } from "@orpc/contract";
import { z } from "zod";

export const authRouter = oc.router({
  getUser: oc.output(
    z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      profilePicture: z.string().nullable(),
    }),
  ),
  logout: oc.output(z.void()),
});
