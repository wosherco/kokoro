import { LinearClient } from "@linear/sdk";

import type { IntegrationAccountDetails } from "@kokoro/validators/integrations";

export const createLinearClient = (token: string) =>
  new LinearClient({ apiKey: token });

export type LinearAccountDetails = IntegrationAccountDetails<LinearClient>;
