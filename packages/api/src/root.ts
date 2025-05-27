import { os } from "./orpc";
import { authRouter } from "./router/auth";
import { landingRouter } from "./router/landing";
import { v1Router } from "./router/v1";

export const appRouter = os.router({
  auth: authRouter,
  landing: landingRouter,

  // Versioned stuff
  v1: v1Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
