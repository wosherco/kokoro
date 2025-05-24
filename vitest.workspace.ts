import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // "packages/*",
  {
    test: {
      name: "rrule",
      root: "./packages/rrule",
      environment: "node",
      globalSetup: "../../vitest.global-setup.ts",
    },
  },
  {
    test: {
      name: "common",
      root: "./packages/common",
      environment: "node",
      globalSetup: "../../vitest.global-setup.ts",
    },
  },
  {
    test: {
      name: "google",
      root: "./packages/platforms/google",
      environment: "node",
      globalSetup: "../../vitest.global-setup.ts",
    },
  },
  {
    test: {
      name: "brain",
      root: "./packages/brain",
      environment: "node",
      globalSetup: "../../vitest.global-setup.ts",
    },
  },
]);
