import { db } from "@kokoro/db/client";
import {
  calendarTable,
  integrationsAccountsTable,
  memoryEventTable,
  memoryTable,
  memoryTaskTable,
  tasklistsTable,
  userTable,
} from "@kokoro/db/schema";
import { GOOGLE_CALENDAR, LINEAR_INTEGRATION } from "@kokoro/validators/db";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getMemories, queryMemories } from "../../../src/memories/query";
import {
  useEmbeddingServiceContainer,
  useDatabaseContainer,
} from "../__utils__/containers";
import {
  TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
  TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
  TEST_EMBEDDING_FIX_LANDING_TYPO_DESCRIPTION,
  TEST_EMBEDDING_FIX_LANDING_TYPO_TEXT,
  TEST_EMBEDDINGS,
} from "../__utils__/embeddings";
import {
  type AwaitedReturnType,
  createCalendar,
  createGoogleCalendarIntegration,
  createLinearIntegration,
  createTasklist,
  createTestUser,
  useTestMemory,
} from "../__utils__/dbUtils";
import { nanoid } from "nanoid";
import type { StartedTestContainer } from "testcontainers";
import { add, addDays, set, sub, subDays } from "date-fns";
import { dateToRRULEString } from "@kokoro/rrule";

vi.mock("@kokoro/db/env", async () => {
  const originalEnvModule = await vi.importActual<
    typeof import("@kokoro/db/env")
  >("@kokoro/db/env");

  return {
    // Preserve other exports from @kokoro/db/env (if any)
    ...originalEnvModule,
    // Override the 'env' export
    env: {
      // Preserve other properties of the original env object
      ...originalEnvModule.env,
      // Override POSTGRES_URL for the test
      POSTGRES_URL: "postgresql://postgres:password@localhost:5432/postgres",
    },
  };
});
vi.mock("../../../env", () => ({
  env: {
    EMBEDDING_SERVICE_URL: "http://localhost:3000",
  },
}));

describe("querying memories", () => {
  useDatabaseContainer();
  let user: AwaitedReturnType<typeof createTestUser>;
  let googleCalendarIntegration: AwaitedReturnType<
    typeof createGoogleCalendarIntegration
  >;
  let linearIntegration: AwaitedReturnType<typeof createLinearIntegration>;
  let calendar: AwaitedReturnType<typeof createCalendar>;
  let tasklist: AwaitedReturnType<typeof createTasklist>;

  beforeAll(async () => {
    // Insert user
    user = await createTestUser({
      email: "test@test.com",
      name: "Test User",
    });

    // Insert calendar integration
    googleCalendarIntegration = await createGoogleCalendarIntegration(user.id);
    linearIntegration = await createLinearIntegration(user.id);
    calendar = await createCalendar(
      user.id,
      googleCalendarIntegration.id,
      googleCalendarIntegration.platformAccountId
    );
    tasklist = await createTasklist(
      user.id,
      linearIntegration.id,
      linearIntegration.platformAccountId
    );
  }, 120000);

  describe("getMemories", () => {
    const dentistMemory = useTestMemory(() => [
      user.id,
      TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
      TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
      {
        event: {
          platformAccountId: calendar.platformAccountId,
          integrationAccountId: calendar.integrationAccountId,
          platformCalendarId: calendar.platformCalendarId,
          platformId: nanoid(),
          icalUid: nanoid(),
          calendarId: calendar.id,
          source: calendar.source,
          sequence: 1,
          startDate: new Date("2025-05-22T13:30:48.512Z"),
          endDate: new Date("2025-05-22T14:30:48.512Z"),
          eventType: "default",
          attendenceStatus: "tentative",
        },
      },
    ]);
    const typoMemory = useTestMemory(() => [
      user.id,
      TEST_EMBEDDING_FIX_LANDING_TYPO_TEXT,
      TEST_EMBEDDING_FIX_LANDING_TYPO_DESCRIPTION,
      {
        task: {
          platformAccountId: tasklist.platformAccountId,
          integrationAccountId: tasklist.integrationAccountId,
          platformTaskListId: tasklist.platformTaskListId,
          platformTaskId: nanoid(),
          source: tasklist.source,
          tasklistId: tasklist.id,
          dueDate: new Date("2025-05-22T13:30:48.512Z"),
        },
      },
    ]);

    it("get empty memories", async () => {
      const memories = await getMemories(user.id, []);
      expect(memories.length).toBe(0);
    });

    it("get single memory", async () => {
      const memories = await getMemories(user.id, [dentistMemory().memory.id]);
      expect(memories.length).toBe(1);
      expect(memories[0]?.id).toBe(dentistMemory().memory.id);
    });

    it("get multiple memories", async () => {
      const memories = await getMemories(user.id, [
        dentistMemory().memory.id,
        typoMemory().memory.id,
      ]);

      expect(memories.length).toBe(2);
      expect(memories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: dentistMemory().memory.id }),
          expect.objectContaining({ id: typoMemory().memory.id }),
        ])
      );
    });
  });

  describe("queryMemories", () => {
    useEmbeddingServiceContainer();

    describe("by date", () => {
      const dayAgoMemoryEvent = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_FIX_LANDING_TYPO_TEXT,
        TEST_EMBEDDING_FIX_LANDING_TYPO_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(subDays(new Date(), 1), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(subDays(new Date(), 1), {
              hours: 11,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
          },
        },
      ]);

      const currentDayMemoryEvent = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(new Date(), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(new Date(), {
              hours: 11,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
          },
        },
      ]);

      const tomorrowMemoryEvent = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(addDays(new Date(), 1), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(addDays(new Date(), 1), {
              hours: 11,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
          },
        },
      ]);

      it("get memories by date sorted descending", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: sub(new Date(), { days: 2 }),
          dateTo: add(new Date(), { days: 2 }),
          orderBy: "desc",
        });

        expect(memories.length).toBe(3);
        expect(memories).toEqual([
          expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
          expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
        ]);
      });

      it("get memories by date sorted ascending", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: sub(new Date(), { days: 2 }),
          dateTo: add(new Date(), { days: 2 }),
          orderBy: "asc",
        });

        expect(memories.length).toBe(3);
        expect(memories).toEqual([
          expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
          expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
        ]);
      });

      it("get yesterday's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(sub(new Date(), { days: 1 }), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(sub(new Date(), { days: 1 }), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        expect(memories.length).toBe(1);
        expect(memories).toEqual([
          expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
        ]);
      });

      it("get today's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(new Date(), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(new Date(), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        expect(memories.length).toBe(1);
        expect(memories).toEqual([
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
        ]);
      });

      it("get tomorrow's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(add(new Date(), { days: 1 }), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(add(new Date(), { days: 1 }), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        expect(memories.length).toBe(1);
        expect(memories).toEqual([
          expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
        ]);
      });

      it("get yesterday's and today's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(sub(new Date(), { days: 1 }), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(new Date(), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        expect(memories.length).toBe(2);
        expect(memories).toEqual([
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
          expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
        ]);
      });

      it("get today's and tomorrow's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(new Date(), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(add(new Date(), { days: 1 }), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        expect(memories.length).toBe(2);
        expect(memories).toEqual([
          expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
        ]);
      });

      it("get memories leaving out tomorrow's end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: set(addDays(new Date(), 1), {
            hours: 10,
            minutes: 30,
            seconds: 0,
            milliseconds: 0,
          }),
        });

        expect(memories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
          ])
        );
      });

      it("get memories leaving out tomorrow's start and end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: set(addDays(new Date(), 1), {
            hours: 9,
            minutes: 30,
            seconds: 0,
            milliseconds: 0,
          }),
        });

        expect(memories).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
          ])
        );
      });

      it("get memories until tomorrow's exact start date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: tomorrowMemoryEvent().event?.startDate,
        });

        expect(memories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
          ])
        );
      });

      it("get memories leaving out yesterday's start date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(sub(new Date(), { days: 1 }), {
            hours: 10,
            minutes: 30,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: new Date(),
        });

        expect(memories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
          ])
        );
      });

      it("get memories leaving out yesterday's start and end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(sub(new Date(), { days: 1 }), {
            hours: 11,
            minutes: 30,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: new Date(),
        });

        expect(memories).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
          ])
        );
      });

      it("get memories from yesterday's exact end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: dayAgoMemoryEvent().event?.endDate,
          dateTo: new Date(),
        });

        expect(memories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
          ])
        );
      });
    });

    describe("recurring events", () => {
      const dailyRecurringMemory = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(new Date(), {
              hours: 9,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(new Date(), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            rrule: `RRULE:FREQ=DAILY;INTERVAL=1;UNTIL=${dateToRRULEString(
              add(new Date(), { days: 10 })
            ).replace("Z", "")}`,
            recurringEnd: set(add(new Date(), { days: 10 }), {
              hours: 23,
              minutes: 59,
              seconds: 59,
              milliseconds: 999,
            }),
          },
        },
      ]);

      const weeklyRecurringMemory = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_FIX_LANDING_TYPO_TEXT,
        TEST_EMBEDDING_FIX_LANDING_TYPO_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(new Date(), {
              hours: 14,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(new Date(), {
              hours: 15,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            rrule: "RRULE:FREQ=WEEKLY;INTERVAL=1",
            recurringEnd: set(add(new Date(), { days: 21 }), {
              hours: 23,
              minutes: 59,
              seconds: 59,
              milliseconds: 999,
            }),
          },
        },
      ]);

      const longRecurringMemory = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
        TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(new Date(), {
              hours: 16,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(new Date(), {
              hours: 17,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            rrule: "RRULE:FREQ=DAILY;INTERVAL=1",
          },
        },
      ]);

      const endedRecurringMemory = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_FIX_LANDING_TYPO_TEXT,
        TEST_EMBEDDING_FIX_LANDING_TYPO_DESCRIPTION,
        {
          event: {
            platformAccountId: calendar.platformAccountId,
            integrationAccountId: calendar.integrationAccountId,
            platformCalendarId: calendar.platformCalendarId,
            platformId: nanoid(),
            icalUid: nanoid(),
            calendarId: calendar.id,
            source: calendar.source,
            sequence: 1,
            attendenceStatus: "tentative",
            eventType: "default",
            startDate: set(sub(new Date(), { days: 5 }), {
              hours: 11,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(sub(new Date(), { days: 5 }), {
              hours: 12,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            rrule: "RRULE:FREQ=DAILY;INTERVAL=1",
            recurringEnd: set(sub(new Date(), { days: 2 }), {
              hours: 23,
              minutes: 59,
              seconds: 59,
              milliseconds: 999,
            }),
          },
        },
      ]);

      it("get daily recurring events within date range", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(new Date(), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(addDays(new Date(), 5), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        const dailyRecurringMatches = memories.filter(
          (m) => m.id === dailyRecurringMemory().memory.id
        );
        expect(dailyRecurringMatches.length).toEqual(6); // 5 days + today
        expect(dailyRecurringMatches).toEqual([
          expect.objectContaining({ id: dailyRecurringMemory().memory.id }),
          expect.objectContaining({ id: dailyRecurringMemory().memory.id }),
          expect.objectContaining({ id: dailyRecurringMemory().memory.id }),
          expect.objectContaining({ id: dailyRecurringMemory().memory.id }),
          expect.objectContaining({ id: dailyRecurringMemory().memory.id }),
          expect.objectContaining({ id: dailyRecurringMemory().memory.id }),
        ]);
      });

      it("get weekly recurring events within date range", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(new Date(), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(addDays(new Date(), 14), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        const weeklyRecurringMatches = memories.filter(
          (m) => m.id === weeklyRecurringMemory().memory.id
        );

        expect(weeklyRecurringMatches.length).toEqual(3);
      });

      it("respect recurring end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: add(new Date(), { days: 15 }),
          orderBy: "asc",
        });

        const dailyRecurringMatches = memories.filter(
          (m) => m.id === dailyRecurringMemory().memory.id
        );

        // Should not extend beyond the recurring end date (10 days)
        expect(dailyRecurringMatches.length).toBeLessThanOrEqual(11); // 10 days + today
      });

      it("exclude ended recurring events", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: add(new Date(), { days: 5 }),
          orderBy: "asc",
        });

        const endedRecurringMatches = memories.filter(
          (m) => m.id === endedRecurringMemory().memory.id
        );

        // Should not find any instances as the recurring period ended 2 days ago
        expect(endedRecurringMatches.length).toBe(0);
      });

      it("include past occurrences of ended recurring events", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: sub(new Date(), { days: 10 }),
          dateTo: sub(new Date(), { days: 1 }),
          orderBy: "asc",
        });

        const endedRecurringMatches = memories.filter(
          (m) => m.id === endedRecurringMemory().memory.id
        );

        // Should find past occurrences within the recurring period
        expect(endedRecurringMatches.length).toBeGreaterThan(0);
      });

      it("limit recurrence calculation to 30 days from dateFrom", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          orderBy: "asc",
        });

        const longRecurringMatches = memories.filter(
          (m) => m.id === longRecurringMemory().memory.id
        );

        // Should be limited to ~30 occurrences despite 45-day query range
        // and 60-day recurring end date
        expect(longRecurringMatches.length).toBeLessThanOrEqual(31); // 30 days + today
      });

      it("don't limit recurrence calculation to 30 days from dateFrom if there's dateTo", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: add(new Date(), { days: 45 }),
          orderBy: "asc",
        });

        const longRecurringMatches = memories.filter(
          (m) => m.id === longRecurringMemory().memory.id
        );

        // Should be limited to ~30 occurrences despite 45-day query range
        // and 60-day recurring end date
        expect(longRecurringMatches.length).toBeLessThanOrEqual(45); // 30 days + today
      });

      it("limit recurrence calculation to 90 days from dateFrom if there's dateTo passed 90 days", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: add(new Date(), { days: 120 }),
          orderBy: "asc",
        });

        const longRecurringMatches = memories.filter(
          (m) => m.id === longRecurringMemory().memory.id
        );

        // Should be limited to ~30 occurrences despite 45-day query range
        // and 60-day recurring end date
        expect(longRecurringMatches.length).toBeLessThanOrEqual(90); // 30 days + today
      });

      it("handle recurring events starting before dateFrom", async () => {
        const startDate = sub(new Date(), { days: 3 });
        const memories = await queryMemories(user.id, {
          dateFrom: startDate,
          dateTo: add(startDate, { days: 5 }),
          orderBy: "asc",
        });

        const endedRecurringMatches = memories.filter(
          (m) => m.id === endedRecurringMemory().memory.id
        );

        // Should find occurrences that fall within the query range
        // even if the original event started before dateFrom
        expect(endedRecurringMatches.length).toBeGreaterThan(0);
      });

      it("sort recurring event occurrences correctly", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: add(new Date(), { days: 3 }),
          orderBy: "asc",
        });

        const dailyMatches = memories.filter(
          (m) => m.id === dailyRecurringMemory().memory.id
        );

        // Verify ascending order by checking that each occurrence
        // is scheduled for the same or later time
        for (let i = 1; i < dailyMatches.length; i++) {
          expect(dailyMatches[i]?.event?.startDate).toEqual(expect.any(Date));
          if (
            dailyMatches[i - 1]?.event?.startDate &&
            dailyMatches[i]?.event?.startDate
          ) {
            expect(
              dailyMatches[i]?.event?.startDate.getTime()
            ).toBeGreaterThanOrEqual(
              dailyMatches[i - 1]?.event?.startDate.getTime() ?? -1
            );
          }
        }
      });
    });
  });
});
