import { oc } from "@orpc/contract";
import { z } from "zod/v4";

export const landingRouter = oc.router({
  contact: oc.input(
    z.object({
      name: z.string(),
      email: z.string(),
      message: z.string(),
    })
  ),
});
