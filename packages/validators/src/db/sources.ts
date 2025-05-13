// Integration Types
export const CALENDAR_INTEGRATION = "CALENDAR_INTEGRATION";
export const TASK_INTEGRATION = "TASK_INTEGRATION";
export const PEOPLE_INTEGRATION = "PEOPLE_INTEGRATION";
export const EMAIL_INTEGRATION = "EMAIL_INTEGRATION";
export const MESSAGES_INTEGRATION = "MESSAGES_INTEGRATION";
export const KNOWLEDGE_INTEGRATION = "KNOWLEDGE_INTEGRATION";

export const INTEGRATION_TYPES = [
  CALENDAR_INTEGRATION,
  TASK_INTEGRATION,
  PEOPLE_INTEGRATION,
  EMAIL_INTEGRATION,
  MESSAGES_INTEGRATION,
  KNOWLEDGE_INTEGRATION,
] as const;

export type IntegrationType = (typeof INTEGRATION_TYPES)[number];
//    External

// Calendar
export const GOOGLE_CALENDAR = "GOOGLE_CALENDAR";

export const CALENDAR_SOURCES = [GOOGLE_CALENDAR] as const;

export type CalendarSource = (typeof CALENDAR_SOURCES)[number];

// Tasks

export const KOKORO_TASKS = "KOKORO_TASKS";
export const LINEAR = "LINEAR";

export const TASK_SOURCES = [
  // TODO
  // KOKORO_TASKS,
  LINEAR,
] as const;

export type TaskSource = (typeof TASK_SOURCES)[number];

// People

export const GOOGLE_PEOPLE = "GOOGLE_PEOPLE";

export const CONTACT_SOURCES = [GOOGLE_PEOPLE, LINEAR] as const;

export type ContactSource = (typeof CONTACT_SOURCES)[number];

// All

export const ALL_INTEGRATIONS = [
  GOOGLE_CALENDAR,
  GOOGLE_PEOPLE,
  // TODO
  // KOKORO_TASKS,
  LINEAR,
] as const;

export type IntegrationSource = (typeof ALL_INTEGRATIONS)[number];

export const MAPPED_INTEGRATION_SOURCES = {
  [CALENDAR_INTEGRATION]: CALENDAR_SOURCES,
  [TASK_INTEGRATION]: TASK_SOURCES,
  [PEOPLE_INTEGRATION]: CONTACT_SOURCES,
  [EMAIL_INTEGRATION]: [],
  [MESSAGES_INTEGRATION]: [],
  [KNOWLEDGE_INTEGRATION]: [],
} as const;

export const RELAXED_MAPPED_INTEGRATION_SOURCES: Record<
  IntegrationType,
  IntegrationSource[]
> = MAPPED_INTEGRATION_SOURCES as unknown as Record<
  IntegrationType,
  IntegrationSource[]
>;
