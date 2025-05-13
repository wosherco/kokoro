import * as p from "@clack/prompts";
import { Command } from "commander";

import {
  DEFAULT_AUTHENTICATOR_URL,
  DEFAULT_SERVER_URL,
  saveAuthenticatorUrl,
  saveServerUrl,
} from "../utils/config";

interface ServerConfig {
  authenticator: string;
  server: string;
}

async function handleCloudServer() {
  await saveAuthenticatorUrl(DEFAULT_AUTHENTICATOR_URL);
  await saveServerUrl(DEFAULT_SERVER_URL);
  p.log.success("Cloud server selected");
  p.outro("All done!");
}

async function handleCustomServer() {
  const customConfig = await p.group({
    authenticator: () =>
      p.text({
        placeholder: DEFAULT_AUTHENTICATOR_URL,
        message: "Enter authenticator URL",
        validate: (value) => {
          try {
            new URL(value);
            return;
          } catch {
            return "Please enter a valid URL";
          }
        },
      }),
    server: () =>
      p.text({
        placeholder: DEFAULT_SERVER_URL,
        message: "Enter server URL",
        validate: (value) => {
          try {
            new URL(value);
            return;
          } catch {
            return "Please enter a valid URL";
          }
        },
      }),
  });

  if (!customConfig) {
    p.log.error("Invalid configuration");
    return;
  }

  await saveAuthenticatorUrl(customConfig.authenticator);
  await saveServerUrl(customConfig.server);
  p.log.success("Custom server configuration received");
  p.outro("All done!");
}

/**
 * Create the mode command
 * @returns The mode command
 */
export function createHostCommand(): Command {
  const hostCommand = new Command("host")
    .description("Choose Kokoro's server")
    .action(async () => {
      const serverType = await p.select({
        message: "Choose server type",
        options: [
          { value: "cloud", label: "Kokoro Cloud" },
          { value: "custom", label: "Custom Server" },
        ],
      });

      if (!serverType || typeof serverType !== "string") {
        p.log.error("No server type selected");
        return;
      }

      if (serverType === "cloud") {
        await handleCloudServer();
        return;
      }

      await handleCustomServer();
    });

  // Add aliases
  hostCommand
    .command("reset")
    .description("Reset to Kokoro Cloud")
    .action(handleCloudServer);

  hostCommand
    .command("custom")
    .description("Configure custom server")
    .action(handleCustomServer);

  return hostCommand;
}
