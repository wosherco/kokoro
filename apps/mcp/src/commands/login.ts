import * as p from "@clack/prompts";
import { Command } from "commander";

import { orpc } from "../orpc";
import { isLoggedIn } from "../utils/auth";
import { getAuthenticatorUrl, saveAuthToken } from "../utils/config";

/**
 * Create the mode command
 * @returns The mode command
 */
export function createLoginCommand(): Command {
  const loginCommand = new Command("login")
    .description("Login to Kokoro")
    .action(async () => {
      p.intro("Kokoro Login");

      if (await isLoggedIn()) {
        p.log.success(
          "You are already logged in. Run the command `logout` to logout",
        );
        return;
      }

      const authenticatorUrl = await getAuthenticatorUrl();

      p.log.message(`Please, access "${authenticatorUrl}/?redirectTo=mcp"`);

      const tokenPrompt = p.password({
        message: "Paste the token shown when finishing the login process",
        validate(value) {
          if (value.trim().length < 5) {
            return "Invalid token";
          }
        },
      });

      const token = await tokenPrompt;

      if (!token || typeof token !== "string") {
        p.log.error("Invalid token");
        return;
      }

      p.log.success("Successfully logged in");

      const spinner = p.spinner();
      spinner.start("Getting your account info...");

      try {
        await saveAuthToken(token);
        const user = await orpc.auth.getUser();
        spinner.stop(`Welcome back, ${user.name}!`);
      } catch {
        spinner.stop("There was an issue logging in. Please try again.");
        await saveAuthToken(null);
      }

      p.outro("Login complete");
      process.exit(0);
    });

  return loginCommand;
}
