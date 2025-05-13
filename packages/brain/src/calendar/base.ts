import type { Modifiable } from "@kokoro/common/poldash";
import type { TransactableDBType } from "@kokoro/db/client";
import type { RecurrenceModifierType } from "@kokoro/validators/actions";
import type {
  GoogleCalendarEventAttendantStatus,
  GoogleCalendarEventType,
} from "@kokoro/validators/db";

export interface ProcessCalendarContext {
  userId: string;
  platformAccountId: string;
  integrationAccountId: string;
}

export interface ProcessEventContext {
  userId: string;
  platformAccountId: string;
  platformCalendarId: string;
  calendarId: string;
  integrationAccountId: string;
}

export abstract class ReadOnlyEventsSource<
  PlatformCalendar,
  PlatformEvent,
  PlatformAdditionalContext = object,
> {
  abstract processCalendar(
    context: ProcessCalendarContext & PlatformAdditionalContext,
    calendar: PlatformCalendar,
    db: TransactableDBType,
  ): Promise<{ id: string; deleted: boolean; inserted: boolean }>;

  abstract syncCalendars(integrationAccountId: string): Promise<void>;

  abstract processEvent(
    context: ProcessEventContext & PlatformAdditionalContext,
    event: PlatformEvent,
    db: TransactableDBType,
  ): Promise<{ memoryId: string; deleted: boolean }>;

  abstract syncEvents(
    integrationAccountId: string,
    calendarId: string,
  ): Promise<void>;

  abstract deleteIntegrationAccount(
    integrationAccountId: string,
  ): Promise<void>;
}

export interface SupportedEventFields {
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  isFullDay: boolean;
  recurrence?: string;
  selfAttendance?: Partial<{
    status: GoogleCalendarEventAttendantStatus;
    comment: string | null;
  }>;
  eventType?: GoogleCalendarEventType;
}

export interface RecurrenceModifierEventInfo {
  type: RecurrenceModifierType;
  /**
   * If provided, we assume that we're working on top of a recurring instance of an event that has not been created yet.
   */
  virtualStartDate?: Date;
}

export abstract class ReadWriteEventsSource<
  PlatformCalendar,
  PlatformEvent,
  PlatformAdditionalContext = object,
> extends ReadOnlyEventsSource<
  PlatformCalendar,
  PlatformEvent,
  PlatformAdditionalContext
> {
  abstract createEvent(
    integrationAccountId: string,
    calendarId: string,
    eventData: SupportedEventFields,
  ): Promise<{ memoryId: string }>;
  abstract updateEvent(
    integrationAccountId: string,
    memoryId: string,
    eventData: Modifiable<SupportedEventFields>,
    recurrenceModifier?: RecurrenceModifierEventInfo,
  ): Promise<void>;
  abstract deleteEvent(
    integrationAccountId: string,
    memoryId: string,
    recurrenceModifier?: RecurrenceModifierEventInfo,
  ): Promise<void>;
}
