import { invalidateSession } from "@kokoro/auth";
import { authorizedMiddleware, os } from "../orpc";

export const authRouter = os.auth.router({
  getUser: os.auth.getUser.use(authorizedMiddleware).handler(({ context }) => {
    return {
      id: context.user.id,
      email: context.user.email,
      name: context.user.name,
      profilePicture: context.user.profilePicture,
    };
  }),

  logout: os.auth.logout
    .use(authorizedMiddleware)
    .handler(async ({ context }) => {
      await invalidateSession(context.session.id);
    }),
});
