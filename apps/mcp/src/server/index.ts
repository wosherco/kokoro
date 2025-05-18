import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  escapeDoubleQuotes,
  groupBy,
  toKebabCase,
  truncate,
} from "@kokoro/common/poldash";
import { SITE_URLS } from "@kokoro/consts";
import type { KokoroActionName } from "@kokoro/validators/actions";
import {
  CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION,
  CALENDAR_CREATE_EVENT_ACTION,
  CALENDAR_DELETE_EVENT_ACTION,
  CALENDAR_MODIFY_EVENT_ACTION,
  KokoroActionPayloadSchemas,
  KokoroActions,
  TASKS_CREATE_TASK_ACTION,
  TASKS_DELETE_TASK_ACTION,
  TASKS_MODIFY_TASK_ACTION,
} from "@kokoro/validators/actions";
import { MEMORY_SORT_BY } from "@kokoro/validators/db";

import { trpc } from "../trpc";
import { VERSION } from "../version";

// Create server instance
const server = new McpServer({
  name: "kokoro-mcp",
  version: VERSION,
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "fetch-integrations",
  "Fetches all the integrations and accounts the user has connected with Kokoro, and operations are supported. Also displays all the calendars and tasklists the user has connected with Kokoro.",
  async () => {
    const integrations = await trpc.v1.integrations.listIntegrations.query();

    if (integrations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No integrations found. Prompt the user to connect their integrations with Kokoro on ${SITE_URLS.account}`,
          },
        ],
      };
    }

    const listCalendars = (integration: (typeof integrations)[number]) =>
      integration.calendars
        .map(
          (calendar) => `
<calendar id="${calendar.id}" name="${truncate(
            escapeDoubleQuotes(
              calendar.summaryOverride ?? calendar.summary ?? ""
            ),
            50
          )}" color="${calendar.colorOverride ?? calendar.color}" />
`
        )
        .join("\n");
    const listTasklists = (integration: (typeof integrations)[number]) =>
      integration.tasklists
        .map(
          (tasklist) => `
<tasklist id="${tasklist.id}" name="${truncate(
            escapeDoubleQuotes(tasklist.name),
            50
          )}" color="${tasklist.color}" />
`
        )
        .join("\n");

    const content = integrations.map(
      (integration) => `
<integration id="${integration.id}" type="${
        integration.integrationType
      }" name="${truncate(
        escapeDoubleQuotes(integration.displayName),
        50
      )}" supports="${integration.supports.join(", ")}">
    ${listCalendars(integration)}
    ${listTasklists(integration)}
</integration>
  `
    );

    return {
      content: [
        {
          type: "text",
          text: `The user has the following integrations connected:
${content.join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "fetch-calendar",
  "Fetches the specified calendar. Will return complete details about the calendar, permissions, limitations, etc. YOU MUST FETCH DETAILS OF A CALENDAR BEFORE REALIZING USING IT.",
  {
    calendarId: z.string().uuid(),
  },
  async ({ calendarId }) => {
    const { calendar, prompt } = await trpc.v1.calendars.getCalendar.query({
      calendarId,
    });

    const striginfiedCalendar = `
<calendar id="${calendar.id}" integrationId="${
      calendar.integrationAccountId
    }" name="${truncate(
      escapeDoubleQuotes(calendar.summaryOverride ?? calendar.summary ?? ""),
      300
    )}" description="${truncate(
      escapeDoubleQuotes(calendar.description ?? ""),
      300
    )}" color="${calendar.colorOverride ?? calendar.color}" source="${
      calendar.source
    }" lastSyncedAt="${calendar.lastSynced?.toISOString()}">
<platformData>
    ${JSON.stringify(calendar.platformData, null, 2)}
</platformData>
</calendar>

${prompt}
    `;

    return {
      content: [{ type: "text", text: striginfiedCalendar }],
    };
  }
);

server.tool(
  "fetch-tasklist",
  "Fetches the specified tasklist. Will return complete details about the tasklist, permissions, limitations, etc. YOU MUST FETCH DETAILS OF A TASKLIST BEFORE REALIZING USING IT.",
  {
    tasklistId: z.string().uuid(),
  },
  async ({ tasklistId }) => {
    const { tasklist, prompt } = await trpc.v1.tasklists.getTasklist.query({
      tasklistId,
    });

    const striginfiedTasklist = `
<tasklist id="${tasklist.id}" integrationId="${
      tasklist.integrationAccountId
    }" name="${truncate(escapeDoubleQuotes(tasklist.name), 300)}" color="${
      tasklist.colorOverride ?? tasklist.color
    }" source="${
      tasklist.source
    }" lastSyncedAt="${tasklist.lastSynced?.toISOString()}">
<config>
    ${JSON.stringify(tasklist.config, null, 2)}
</config>
</tasklist>

${prompt}
    `;

    return {
      content: [{ type: "text", text: striginfiedTasklist }],
    };
  }
);

type QueriedMemory = Awaited<
  ReturnType<typeof trpc.v1.memories.queryMemories.query>
>[number];

const stringifyEvent = (event: NonNullable<QueriedMemory["event"]>) => `
<event calendarId="${event.calendarId}" integrationAccountId="${
  event.integrationAccountId
}" source="${
  event.source
}" startDate="${event.startDate.toISOString()}" endDate="${event.endDate.toISOString()}" isFullDay="${
  event.isFullDay
}" rrule="${event.rrule}" type="${event.eventType}" attendance="${
  event.attendenceStatus
}" />
`;

const stringifyTask = (
  task: NonNullable<QueriedMemory["task"]>,
  taskAttributes: NonNullable<QueriedMemory["taskAttributes"]>
) => `
<task tasklistId="${task.tasklistId}" integrationAccountId="${
  task.integrationAccountId
}" source="${task.source}" dueDate="${task.dueDate?.toISOString()}" priority="${
  taskAttributes.find((attr) => attr.priority !== null)?.priority
}" state="${taskAttributes.find((attr) => attr.state !== null)?.state}">
${taskAttributes
  .map(
    (attribute) =>
      `<attribute id="${attribute.platformAttributeId}" value="${attribute.platformValue}" />`
  )
  .join("\n")}
</task>
`;

const stringifyMemory = (memory: QueriedMemory, truncateLength = 50) => `
<memory id="${memory.id}" content="${truncate(
  escapeDoubleQuotes(memory.content),
  truncateLength
)}" description="${truncate(
  escapeDoubleQuotes(memory.description ?? ""),
  truncateLength
)}" isVirtual="${memory.isVirtual}">
${memory.event ? stringifyEvent(memory.event) : ""}
${memory.task ? stringifyTask(memory.task, memory.taskAttributes) : ""}
</memory>
`;

server.tool(
  "query-memories",
  "Memories are Kokoro's way of storing information from different sources in a single place.",
  {
    contentQuery: z
      .string()
      .max(100)
      .optional()
      .describe("A query to search for memories by content"),
    descriptionQuery: z
      .string()
      .max(100)
      .optional()
      .describe("A query to search for memories by description"),
    startDate: z
      .string()
      .datetime({
        offset: true,
      })
      .optional()
      .describe(
        "A start date to filter memories by. Must be in ISO 8601 format."
      ),
    endDate: z
      .string()
      .datetime({
        offset: true,
      })
      .optional()
      .describe(
        "An end date to filter memories by. Must be in ISO 8601 format."
      ),
    integrationAccountIds: z
      .array(z.string().uuid())
      .optional()
      .nullable()
      .describe(
        "If provided, only memories from these integration accounts will be returned. If not provided, won't be filtered by integration accounts."
      ),
    calendarIds: z
      .array(z.string().uuid())
      .optional()
      .nullable()
      .describe(
        "If provided, only memories from these calendars will be returned. If not provided, won't be filtered by calendars."
      ),
    tasklistIds: z
      .array(z.string().uuid())
      .optional()
      .nullable()
      .describe(
        "If provided, only memories from these tasklists will be returned. If not provided, won't be filtered by tasklists."
      ),
    sortBy: z
      .enum(MEMORY_SORT_BY)
      .optional()
      .describe("The sort order of the memories"),
  },
  async (args) => {
    const memories = await trpc.v1.memories.queryMemories.query({
      ...args,
      integrationAccountIds: args.integrationAccountIds ?? undefined,
      calendarIds: args.calendarIds ?? undefined,
      tasklistIds: args.tasklistIds ?? undefined,
    });

    const content = `${memories
      .map(stringifyMemory)
      .join(
        "\n"
      )}\n\nTo get full details of a memory, use the \`fetch-memory\` tool.`;

    return { content: [{ type: "text", text: content }] };
  }
);

server.tool(
  "fetch-memory",
  "Fetches the specified memory. Will return complete details about the memory, permissions, limitations, etc.",
  {
    memoryId: z.string().uuid(),
  },
  async ({ memoryId }) => {
    const [memory] = await trpc.v1.memories.getMemories.query({
      memoryIds: [memoryId],
    });

    return { content: [{ type: "text", text: stringifyMemory(memory, 300) }] };
  }
);

server.tool(
  "query-contacts",
  "Contacts are Kokoro's way of storing information about people. If you need information about a person, you can use this tool to search for them.",
  {
    email: z
      .string()
      .email()
      .optional()
      .describe("An email to search for contacts by"),
    name: z
      .string()
      .optional()
      .describe(
        "A name to search for contacts by. Full text search will be performed."
      ),
  },
  async ({ email, name }) => {
    if (!email && !name) {
      throw new Error("Either email or name must be provided");
    }

    const contacts = await trpc.v1.contacts.queryContacts.query(
      // biome-ignore lint/style/noNonNullAssertion: Because of the type, it's email or name.
      email ? { email } : { name: name! }
    );

    type Contact = (typeof contacts)[number];

    const sortPrimary = <T extends { primary: boolean }>(items: T[]) =>
      items.sort((a, b) => (b.primary ? -1 : 1));

    const stringifyLink = (
      link: Contact["links"][number],
      names: Contact["names"],
      emails: Contact["emails"]
    ) => `
<link source="${link.source}">
  ${sortPrimary(names)
    .map(
      (name) =>
        `<name${name.primary ? " primary" : ""}>${name.displayName}</name>`
    )
    .join("\n")}
  ${sortPrimary(emails)
    .map(
      (email) =>
        `<email${email.primary ? " primary" : ""}>${email.email}</email>`
    )
    .join("\n")}
</link>
`;

    const stringifyContact = (contact: Contact) => {
      const groupedNames = groupBy(contact.names, "linkId");
      const groupedEmails = groupBy(contact.emails, "linkId");

      return `
<contact id="${contact.id}">
    ${contact.links
      .map((link) =>
        stringifyLink(link, groupedNames[link.id], groupedEmails[link.id])
      )
      .join("\n")}
</contact>
`;
    };

    const content = contacts.map(stringifyContact).join("\n");

    return { content: [{ type: "text", text: content }] };
  }
);

function betterActionName(actionName: KokoroActionName) {
  const [type, name] = actionName.split(":");

  return `${type.toLowerCase()}-${toKebabCase(name)}`;
}

const DESCRIPTIONS: Record<KokoroActionName, string> = {
  [CALENDAR_CREATE_EVENT_ACTION]: "Creates an event on the specified calendar.",
  [CALENDAR_MODIFY_EVENT_ACTION]:
    "Modifies an event. If the event is recurring, you must specify a recurrence modifier. If the memory event is virtual, and when only virtual, provide the virtual start date.",
  [CALENDAR_DELETE_EVENT_ACTION]:
    "Deletes an event on the specified calendar. If the event is recurring, you must specify a recurrence modifier. If the memory event is virtual, and when only virtual, provide the virtual start date.",
  [CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION]:
    "Changes the attendance of an event on the specified calendar.",
  [TASKS_CREATE_TASK_ACTION]: "Creates a task on the specified tasklist.",
  [TASKS_MODIFY_TASK_ACTION]: "Modifies a task on the specified tasklist.",
  [TASKS_DELETE_TASK_ACTION]: "Deletes a task on the specified tasklist.",
};

for (const actionName of KokoroActions) {
  server.tool(
    betterActionName(actionName),
    DESCRIPTIONS[actionName],
    {
      payload: KokoroActionPayloadSchemas[actionName],
    },
    async (cb) => {
      // Parsing the payload to verify it's valid before sending to the server
      const payload = KokoroActionPayloadSchemas[actionName].parse(cb.payload);

      const result = await trpc.v1.actions.runAction.mutate({
        name: actionName,
        payload,
      });

      return {
        content: [
          {
            type: "text",
            text: `Action ${actionName} executed successfully. Result: "${result.result}"`,
          },
        ],
      };
    }
  );
}

export async function runMCPServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kokoro MCP Server running on stdio");
}
