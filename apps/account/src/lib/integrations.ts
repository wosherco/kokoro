import type { IntegrationSource, IntegrationType } from "@kokoro/validators/db";
import {
  CALENDAR_INTEGRATION,
  EMAIL_INTEGRATION,
  KNOWLEDGE_INTEGRATION,
  MESSAGES_INTEGRATION,
  PEOPLE_INTEGRATION,
  TASK_INTEGRATION,
} from "@kokoro/validators/db";

export const INTEGRATIONS_DATA: Record<
  IntegrationSource,
  {
    name: string;
    icon: string;
    reauthorizeUrl: string;
    description: string;
  }
> = {
  GOOGLE_CALENDAR: {
    name: "Google Calendar",
    icon: "/cdn/logos/google-calendar.svg",
    reauthorizeUrl: "google-calendar",
    description:
      "Sync your Google Calendar events and manage your schedule directly from kokoro.",
  },
  GOOGLE_PEOPLE: {
    name: "Google People",
    icon: "/cdn/logos/google-people.svg",
    reauthorizeUrl: "google-people",
    description: "Access your Google Contacts from kokoro.",
  },
  LINEAR: {
    name: "Linear",
    icon: "/cdn/logos/linear.svg",
    reauthorizeUrl: "linear",
    description: "Track and manage your Linear tasks.",
  },
};

export const INTEGRATION_TYPES_DATA: Record<
  IntegrationType,
  {
    name: string;
    disabled: boolean;
    slug: string;
  }
> = {
  [CALENDAR_INTEGRATION]: {
    name: "Calendar",
    disabled: false,
    slug: "calendars",
  },
  [TASK_INTEGRATION]: {
    name: "Tasks",
    disabled: false,
    slug: "tasks",
  },
  [PEOPLE_INTEGRATION]: {
    name: "People",
    disabled: false,
    slug: "people",
  },
  [EMAIL_INTEGRATION]: {
    name: "Email",
    disabled: true,
    slug: "email",
  },
  [MESSAGES_INTEGRATION]: {
    name: "Messages",
    disabled: true,
    slug: "messages",
  },
  [KNOWLEDGE_INTEGRATION]: {
    name: "Knowledge",
    disabled: true,
    slug: "knowledge",
  },
};
