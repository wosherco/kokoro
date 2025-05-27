import { authRouter } from "./auth";
import { landingRouter } from "./landing";
import { v1Router } from "./v1";
import * as _A from "../../../../node_modules/zod/dist/types/v4/classic/iso";
export const orpcContract = {
  auth: authRouter,
  landing: landingRouter,
  v1: v1Router,
};
