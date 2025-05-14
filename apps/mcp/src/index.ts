import { Command } from "commander";

import { createHostCommand } from "./commands/host";
import { createLoginCommand } from "./commands/login";
import { createLogoutCommand } from "./commands/logout";
import { runMCPServer } from "./server";
import { GIT_SHA, VERSION } from "./version";

/**
 * Create and configure the CLI program
 */
export function createCLI() {
  const program = new Command()
    .name("kokoro-mcp")
    .description("kokoro-mcp CLI")
    .version(`${VERSION} (${GIT_SHA})`)
    .argument("[command]", "The command to run")
    .action(async (command) => {
      if (command) {
        program.outputHelp();
      } else {
        try {
          await runMCPServer();
        } catch (error) {
          console.error("Error running server:", error);
          process.exit(1);
        }
      }
    });

  // Add commands
  program.addCommand(createLoginCommand());
  program.addCommand(createHostCommand());
  program.addCommand(createLogoutCommand());

  return program;
}

/**
 * Export the CLI for use in bin/index.ts
 */
export default createCLI;
