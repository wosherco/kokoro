import { os } from "../../orpc";
import { v1ActionsRouter } from "./actions";
import { v1CalendarsRouter } from "./calendars";
import { v1ContactsRouter } from "./contacts";
import { v1DevelopersApplicationsRouter } from "./developers/applications";
import { v1IntegrationsRouter } from "./integrations";
import { v1MemoriesRouter } from "./memories";
import { v1TasklistsRouter } from "./tasklists";

export const v1Router = os.v1.router({
  integrations: v1IntegrationsRouter,
  actions: v1ActionsRouter,
  calendars: v1CalendarsRouter,
  tasklists: v1TasklistsRouter,
  memories: v1MemoriesRouter,
  contacts: v1ContactsRouter,

  developers: {
    applications: v1DevelopersApplicationsRouter,
  },
});
