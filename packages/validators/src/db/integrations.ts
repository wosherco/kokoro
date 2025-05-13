import { GOOGLE_CALENDAR, GOOGLE_PEOPLE } from "./sources";

export const LINEAR_INTEGRATION = "LINEAR";

export const INTEGRATIONS = [
  LINEAR_INTEGRATION,
  GOOGLE_PEOPLE,
  GOOGLE_CALENDAR,
] as const;

export type Integration = (typeof INTEGRATIONS)[number];
