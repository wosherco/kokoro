import { adminRouter } from "./router/admin";
import { authRouter } from "./router/auth";
import { inappRouter } from "./router/inapp";
import { landingRouter } from "./router/landing";
import { onboardingRouter } from "./router/onboarding";
import { v1Router } from "./router/v1";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  admin: adminRouter,
  landing: landingRouter,

  /**
   * This is just unused right now. Used for app.
   */
  onboarding: onboardingRouter,
  /**
   * This is just unused right now. Used for app.
   */
  inapp: inappRouter,

  // Versioned stuff
  v1: v1Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
