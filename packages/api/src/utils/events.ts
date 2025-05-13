import type { QueriedMemory } from "@kokoro/brain";
import { isDateMatchingRrule } from "@kokoro/rrule";
import type { VirtualEvent } from "@kokoro/validators/actions";

import { parseDate } from "./date";

export function checkIfVirtualEventsMatchRrule(
  memory: QueriedMemory,
  virtualEvent: VirtualEvent,
) {
  if (!memory.event) {
    throw new Error("Event not found");
  }

  const payloadVirtualStartDate = parseDate(virtualEvent.virtualStartDate);

  if (payloadVirtualStartDate) {
    if (!memory.event.rrule) {
      throw new Error("Event is not recurring");
    }

    if (
      !isDateMatchingRrule(
        memory.event.rrule,
        memory.event.startDate,
        payloadVirtualStartDate,
      )
    ) {
      throw new Error("Start date does not match recurrence rule");
    }
  }
}
