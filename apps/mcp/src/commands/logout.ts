import * as p from "@clack/prompts";
import { Command } from "commander";

import { trpc } from "../trpc";
import { isLoggedIn } from "../utils/auth";
import { saveAuthToken } from "../utils/config";

/**
 * Create the mode command
 * @returns The mode command
 */
export function createLogoutCommand(): Command {
  const logoutCommand = new Command("logout")
    .description("Logout from Kokoro")
    .action(async () => {
      p.intro("Kokoro Logout");

      if (!(await isLoggedIn())) {
        p.log.success(
          "You are not logged in. Use `npx -y @kokoro.ws/mcp login` to login",
        );
        return;
      }

      try {
        await trpc.auth.logout.mutate();
      } catch {
        p.log.error("Failed to erase your token from the server");
      } finally {
        await saveAuthToken(null);
      }

      p.outro("Successfully logged out");
    });

  return logoutCommand;
}
