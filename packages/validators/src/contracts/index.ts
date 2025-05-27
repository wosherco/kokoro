import { oc } from "@orpc/contract";
import { authRouter } from "./auth";
import { landingRouter } from "./landing";
import { v1Router } from "./v1";

export const orpcContract = oc.router({
  auth: authRouter,
  landing: landingRouter,
  v1: v1Router,
});
