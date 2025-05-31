import { dateToRRULEString } from "@kokoro/rrule";
import { EVENT_MEMORY_TYPE } from "@kokoro/validators/db";
import {
  add,
  addDays,
  endOfDay,
  endOfToday,
  endOfTomorrow,
  endOfYesterday,
  set,
  setHours,
  startOfToday,
  startOfTomorrow,
  startOfYesterday,
  subDays,
} from "date-fns";
import { nanoid } from "nanoid";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getMemories, queryMemories } from "../../../src/memories/query";
import {
  useDatabaseContainer,
  useEmbeddingServiceContainer,
} from "../__utils__/containers";
import {
  type AwaitedReturnType,
  createCalendar,
  createGoogleCalendarIntegration,
  createLinearIntegration,
  createTasklist,
  createTestUser,
  useTestMemory,
} from "../__utils__/dbUtils";
import {
  TEST_EMBEDDINGS,
  TEST_EMBEDDING_DENTIST_APPOINTMENT_DESCRIPTION,
  TEST_EMBEDDING_DENTIST_APPOINTMENT_TEXT,
  TEST_EMBEDDING_DENTIST_FIX_DESCRIPTION,
  TEST_EMBEDDING_DENTIST_FIX_TEXT,
  TEST_EMBEDDING_FIX_LANDING_TYPO_DESCRIPTION,
  TEST_EMBEDDING_FIX_LANDING_TYPO_TEXT,
} from "../__utils__/embeddings";

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
            startDate: setHours(startOfYesterday(), 10),
            endDate: setHours(startOfYesterday(), 11),
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
            startDate: setHours(startOfToday(), 10),
            endDate: setHours(startOfToday(), 11),
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
            startDate: setHours(startOfTomorrow(), 10),
            endDate: setHours(startOfTomorrow(), 11),
          },
        },
      ]);

      it("get memories by date sorted descending", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: subDays(new Date(), 2),
          dateTo: addDays(new Date(), 2),
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
          dateFrom: subDays(new Date(), 2),
          dateTo: addDays(new Date(), 2),
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
          dateFrom: startOfYesterday(),
          dateTo: endOfYesterday(),
        });

        expect(memories.length).toBe(1);
        expect(memories).toEqual([
          expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
        ]);
      });

      it("get today's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfToday(),
          dateTo: endOfToday(),
        });

        expect(memories.length).toBe(1);
        expect(memories).toEqual([
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
        ]);
      });

      it("get tomorrow's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfTomorrow(),
          dateTo: endOfTomorrow(),
        });

        expect(memories.length).toBe(1);
        expect(memories).toEqual([
          expect.objectContaining({ id: tomorrowMemoryEvent().memory.id }),
        ]);
      });

      it("get yesterday's and today's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfYesterday(),
          dateTo: endOfToday(),
        });

        expect(memories.length).toBe(2);
        expect(memories).toEqual([
          expect.objectContaining({ id: currentDayMemoryEvent().memory.id }),
          expect.objectContaining({ id: dayAgoMemoryEvent().memory.id }),
        ]);
      });

      it("get today's and tomorrow's memories", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfToday(),
          dateTo: endOfTomorrow(),
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
          dateTo: set(startOfTomorrow(), {
            hours: 10,
            minutes: 30,
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
          dateTo: set(startOfTomorrow(), {
            hours: 9,
            minutes: 30,
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
          dateFrom: setHours(startOfYesterday(), 10),
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
          dateFrom: set(startOfYesterday(), {
            hours: 11,
            minutes: 30,
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
            startDate: setHours(startOfToday(), 9),
            endDate: setHours(startOfToday(), 10),
            rrule: `RRULE:FREQ=DAILY;INTERVAL=1;UNTIL=${dateToRRULEString(
              addDays(endOfToday(), 10)
            ).replace("Z", "")}`,
            recurringEnd: addDays(endOfToday(), 10),
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
            startDate: setHours(startOfToday(), 14),
            endDate: setHours(startOfToday(), 15),
            rrule: `RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=${dateToRRULEString(
              addDays(endOfToday(), 21)
            ).replace("Z", "")}`,
            recurringEnd: addDays(endOfToday(), 21),
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
            startDate: setHours(startOfToday(), 16),
            endDate: setHours(startOfToday(), 17),
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
            startDate: setHours(subDays(startOfToday(), 5), 11),
            endDate: setHours(subDays(startOfToday(), 5), 12),
            rrule: "RRULE:FREQ=DAILY;INTERVAL=1",
            recurringEnd: subDays(endOfToday(), 2),
          },
        },
      ]);

      it("get daily recurring events within date range", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfToday(),
          dateTo: addDays(endOfToday(), 5),
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
          dateFrom: startOfToday(),
          dateTo: addDays(endOfToday(), 14),
        });

        const weeklyRecurringMatches = memories.filter(
          (m) => m.id === weeklyRecurringMemory().memory.id
        );

        expect(weeklyRecurringMatches.length).toEqual(3);
      });

      it("respect recurring end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: addDays(new Date(), 15),
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
          dateTo: addDays(new Date(), 5),
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
          dateFrom: subDays(new Date(), 10),
          dateTo: subDays(new Date(), 1),
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
          dateTo: addDays(new Date(), 45),
          orderBy: "asc",
        });

        const longRecurringMatches = memories.filter(
          (m) => m.id === longRecurringMemory().memory.id
        );

        // Should be limited to ~30 occurrences despite 45-day query range
        // and 60-day recurring end date
        expect(longRecurringMatches.length).toBeLessThanOrEqual(46); // 30 days + today
      });

      it("limit recurrence calculation to 90 days from dateFrom if there's dateTo passed 90 days", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: new Date(),
          dateTo: addDays(new Date(), 120),
          orderBy: "asc",
        });

        const longRecurringMatches = memories.filter(
          (m) => m.id === longRecurringMemory().memory.id
        );

        // Should be limited to ~30 occurrences despite 45-day query range
        // and 60-day recurring end date
        expect(longRecurringMatches.length).toBeLessThanOrEqual(91); // 30 days + today
      });

      it("handle recurring events starting before dateFrom", async () => {
        const startDate = subDays(new Date(), 3);
        const memories = await queryMemories(user.id, {
          dateFrom: startDate,
          dateTo: addDays(startDate, 5),
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
          dateTo: addDays(new Date(), 3),
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

    describe("recurring instances", () => {
      const parentRecurringMemory = useTestMemory(() => [
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
            rrule: "RRULE:FREQ=DAILY;INTERVAL=1",
          },
        },
      ]);

      // Recurring instance for tomorrow - rescheduled to different time
      const rescheduledInstanceMemory = useTestMemory(() => [
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
            sequence: 2,
            attendenceStatus: "tentative",
            eventType: "default",
            // Actual rescheduled time
            startDate: set(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              addDays(parentRecurringMemory().event?.startDate!, 1),
              {
                hours: 15,
                minutes: 30,
                seconds: 0,
                milliseconds: 0,
              }
            ),
            endDate: set(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              addDays(parentRecurringMemory().event?.startDate!, 1),
              {
                hours: 16,
                minutes: 30,
                seconds: 0,
                milliseconds: 0,
              }
            ),
            // Reference to parent recurring event
            recurringEventPlatformId: parentRecurringMemory().event?.platformId,
            // Original time from the rrule
            startOriginal: addDays(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              parentRecurringMemory().event?.startDate!,
              1
            ),
          },
        },
      ]);

      // Recurring instance for day after tomorrow - cancelled
      const cancelledInstanceMemory = useTestMemory(() => [
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
            sequence: 2,
            attendenceStatus: "declined",
            eventType: "default",
            // Cancelled events might still have original time or null
            startDate: set(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              addDays(parentRecurringMemory().event?.startDate!, 2),
              {
                hours: 10,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              }
            ),
            endDate: set(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              addDays(parentRecurringMemory().event?.startDate!, 2),
              {
                hours: 11,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              }
            ),
            // Reference to parent recurring event
            recurringEventPlatformId: parentRecurringMemory().event?.platformId,
            // Original time from the rrule
            startOriginal: addDays(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              parentRecurringMemory().event?.startDate!,
              2
            ),
          },
        },
      ]);

      // Recurring instance for 3 days from now - updated details but same time
      const updatedInstanceMemory = useTestMemory(() => [
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
            sequence: 2,
            attendenceStatus: "accepted",
            eventType: "default",
            // Same time as original but with updated details
            startDate: set(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              addDays(parentRecurringMemory().event?.startDate!, 3),
              {
                hours: 10,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              }
            ),
            endDate: set(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              addDays(parentRecurringMemory().event?.startDate!, 3),
              {
                hours: 11,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              }
            ),
            // Reference to parent recurring event
            recurringEventPlatformId: parentRecurringMemory().event?.platformId,
            // Original time from the rrule (same as actual time)
            startOriginal: addDays(
              // biome-ignore lint/style/noNonNullAssertion: This should not be null at this point
              parentRecurringMemory().event?.startDate!,
              3
            ),
          },
        },
      ]);

      it("should return actual instances instead of virtual ones", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfToday(),
          dateTo: endOfDay(addDays(new Date(), 5)),
          orderBy: "asc",
        });

        expect(memories.length).toEqual(6);

        // Find specific instances
        const rescheduledInstance = memories.find(
          (m) => m.id === rescheduledInstanceMemory().memory.id
        );
        const cancelledInstance = memories.find(
          (m) => m.id === cancelledInstanceMemory().memory.id
        );
        const updatedInstance = memories.find(
          (m) => m.id === updatedInstanceMemory().memory.id
        );

        // Should have the actual instances, not virtual ones for those dates
        expect(rescheduledInstance).toBeDefined();
        expect(rescheduledInstance?.event?.startDate?.getHours()).toBe(15); // Rescheduled time
        expect(rescheduledInstance?.event?.startOriginal?.getHours()).toBe(10); // Original time

        expect(cancelledInstance).toBeDefined();
        expect(cancelledInstance?.event?.attendenceStatus).toBe("declined");

        expect(updatedInstance).toBeDefined();
        expect(updatedInstance?.event?.attendenceStatus).toBe("accepted");
      });

      it.skip("(NOT IMPLEMENTED YET) should exclude cancelled instances from results", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfToday(),
          dateTo: endOfDay(addDays(new Date(), 5)),
          // excludeCancelled: true,
        });

        const cancelledInstance = memories.find(
          (m) => m.id === cancelledInstanceMemory().memory.id
        );

        expect(cancelledInstance).toBeUndefined();

        // But should still have other instances
        const rescheduledInstance = memories.find(
          (m) => m.id === rescheduledInstanceMemory().memory.id
        );
        expect(rescheduledInstance).toBeDefined();
      });

      it("should generate virtual instances for dates without actual instances", async () => {
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
          orderBy: "asc",
        });

        // Find virtual instances (parent recurring memory ID)
        const virtualInstances = memories.filter(
          (m) => m.id === parentRecurringMemory().memory.id
        );

        // Should have virtual instances for today, 4 days from now, and 5 days from now
        // (tomorrow, day after tomorrow, and 3 days from now have actual instances)
        expect(virtualInstances.length).toEqual(3);

        // Check that virtual instances have the correct original times
        for (const instance of virtualInstances) {
          expect(instance.event?.startDate?.getHours()).toBe(10);
          expect(instance.event?.endDate?.getHours()).toBe(11);
        }
      });

      it("should handle rescheduled instances with different times", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: set(addDays(new Date(), 1), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          dateTo: set(addDays(new Date(), 1), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          }),
        });

        const tomorrowInstance = memories.find(
          (m) => m.id === rescheduledInstanceMemory().memory.id
        );

        expect(tomorrowInstance).toBeDefined();
        expect(tomorrowInstance?.event?.startDate?.getHours()).toBe(15);
        expect(tomorrowInstance?.event?.startDate?.getMinutes()).toBe(30);
        expect(tomorrowInstance?.event?.startOriginal?.getHours()).toBe(10);
        expect(tomorrowInstance?.event?.startOriginal?.getMinutes()).toBe(0);
        expect(tomorrowInstance?.event?.recurringEventPlatformId).toBe(
          parentRecurringMemory().event?.platformId
        );
      });

      it("should sort instances correctly with mixed virtual and actual", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: startOfToday(),
          dateTo: addDays(endOfToday(), 5),
          orderBy: "asc",
        });

        const recurringMatches = memories.filter(
          (m) =>
            m.id === parentRecurringMemory().memory.id ||
            m.id === rescheduledInstanceMemory().memory.id ||
            m.id === cancelledInstanceMemory().memory.id ||
            m.id === updatedInstanceMemory().memory.id
        );

        // Should be sorted by start date
        for (let i = 1; i < recurringMatches.length; i++) {
          const prev = recurringMatches[i - 1];
          const curr = recurringMatches[i];
          if (prev?.event?.startDate && curr?.event?.startDate) {
            expect(curr.event.startDate.getTime()).toBeGreaterThanOrEqual(
              prev.event.startDate.getTime()
            );
          }
        }
      });

      const extendedInstanceMemory = useTestMemory(() => [
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
            sequence: 2,
            attendenceStatus: "accepted",
            eventType: "default",
            // Date beyond the parent recurring end date
            startDate: set(addDays(new Date(), 15), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            endDate: set(addDays(new Date(), 15), {
              hours: 11,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
            // Reference to parent recurring event
            recurringEventPlatformId: parentRecurringMemory().event?.platformId,
            // Original time from the rrule
            startOriginal: set(addDays(new Date(), 15), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
          },
        },
      ]);

      it("should handle instances that extend beyond parent recurring end date", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: addDays(startOfToday(), 15),
          dateTo: addDays(endOfToday(), 15),
        });

        const extendedInstance = memories.find(
          (m) => m.id === extendedInstanceMemory().memory.id
        );

        // Should find the extended instance even though it's beyond the parent's end date
        expect(extendedInstance).toBeDefined();
        expect(extendedInstance?.event?.recurringEventPlatformId).toBe(
          parentRecurringMemory().event?.platformId
        );
      });

      const pastInstanceMemory = useTestMemory(() => [
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
            sequence: 2,
            attendenceStatus: "accepted",
            eventType: "default",
            // Past date
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
            // Reference to parent recurring event
            recurringEventPlatformId: parentRecurringMemory().event?.platformId,
            // Original time from the rrule
            startOriginal: set(subDays(new Date(), 1), {
              hours: 10,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            }),
          },
        },
      ]);

      it("should handle instances created for past occurrences", async () => {
        const memories = await queryMemories(user.id, {
          dateFrom: subDays(startOfToday(), 2),
          dateTo: endOfToday(),
        });

        const pastInstance = memories.find(
          (m) => m.id === pastInstanceMemory().memory.id
        );

        expect(pastInstance).toBeDefined();
        expect(pastInstance?.event?.attendenceStatus).toBe("accepted");
      });
    });

    describe("text search", () => {
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
      const dentistFixMemory = useTestMemory(() => [
        user.id,
        TEST_EMBEDDING_DENTIST_FIX_TEXT,
        TEST_EMBEDDING_DENTIST_FIX_DESCRIPTION,
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

      it('should return memories that match the text query "typo" (title)', async () => {
        const memories = await queryMemories(user.id, {
          textQuery: "typo",
        });

        expect(memories.length).toEqual(1);
        expect(memories[0]?.id).toEqual(typoMemory().memory.id);
      });

      it('should return memories that match the text query "wisdom teeth" (description)', async () => {
        const memories = await queryMemories(user.id, {
          textQuery: "wisdom teeth",
        });

        expect(memories.length).toEqual(1);
        expect(memories[0]?.id).toEqual(dentistMemory().memory.id);
      });

      it('should return memories that match the text query "fix" (common words)', async () => {
        const memories = await queryMemories(user.id, {
          textQuery: "fix",
        });

        expect(memories.length).toEqual(2);
        expect(memories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: typoMemory().memory.id,
            }),
            expect.objectContaining({
              id: dentistFixMemory().memory.id,
            }),
          ])
        );
      });

      it('should return memories that match the text query "dentist" (common words)', async () => {
        const memories = await queryMemories(user.id, {
          textQuery: "dentist",
        });

        expect(memories.length).toEqual(2);
        expect(memories).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: dentistMemory().memory.id,
            }),
            expect.objectContaining({
              id: dentistFixMemory().memory.id,
            }),
          ])
        );
      });

      it('should return memories that match the text query "dentist" filtered by integrationAccountId', async () => {
        const memories = await queryMemories(user.id, {
          textQuery: "dentist",
          integrationAccountIds: [tasklist.integrationAccountId],
        });

        expect(memories.length).toEqual(1);
        expect(memories[0]?.id).toEqual(dentistFixMemory().memory.id);
      });

      it('should return memories that match the text query "dentist" filtered by memory type', async () => {
        const memories = await queryMemories(user.id, {
          textQuery: "dentist",
          memoryTypes: new Set([EVENT_MEMORY_TYPE]),
        });

        expect(memories.length).toEqual(1);
        expect(memories[0]?.id).toEqual(dentistMemory().memory.id);
      });
    });
  });
});
