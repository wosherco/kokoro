import type {
  ActionPayload,
  BaseActionWithPayload,
  KokoroActionName,
} from "@kokoro/validators/actions";
import {
  CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION,
  CALENDAR_CREATE_EVENT_ACTION,
  CALENDAR_DELETE_EVENT_ACTION,
  CALENDAR_MODIFY_EVENT_ACTION,
  TASKS_CREATE_TASK_ACTION,
  TASKS_DELETE_TASK_ACTION,
  TASKS_MODIFY_TASK_ACTION,
} from "@kokoro/validators/actions";

import {
  changeEventAttendanceAction,
  createCalendarEventAction,
  deleteCalendarEventAction,
  modifyCalendarEventAction,
} from "./calendar";
import type { ActionContext } from "./context";
import { createTaskAction, deleteTaskAction, updateTaskAction } from "./tasks";

export async function executeAction<ActionName extends KokoroActionName>(
  context: ActionContext,
  action: BaseActionWithPayload<ActionName>,
): Promise<string> {
  switch (action.name) {
    case CALENDAR_CREATE_EVENT_ACTION:
      return await createCalendarEventAction(
        context,
        action.payload as ActionPayload<typeof CALENDAR_CREATE_EVENT_ACTION>,
      );
    case CALENDAR_MODIFY_EVENT_ACTION:
      return await modifyCalendarEventAction(
        context,
        action.payload as ActionPayload<typeof CALENDAR_MODIFY_EVENT_ACTION>,
      );
    case CALENDAR_DELETE_EVENT_ACTION:
      return await deleteCalendarEventAction(
        context,
        action.payload as ActionPayload<typeof CALENDAR_DELETE_EVENT_ACTION>,
      );
    case CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION:
      return await changeEventAttendanceAction(
        context,
        action.payload as ActionPayload<
          typeof CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION
        >,
      );
    case TASKS_CREATE_TASK_ACTION:
      return await createTaskAction(
        context,
        action.payload as ActionPayload<typeof TASKS_CREATE_TASK_ACTION>,
      );
    case TASKS_MODIFY_TASK_ACTION:
      return await updateTaskAction(
        context,
        action.payload as ActionPayload<typeof TASKS_MODIFY_TASK_ACTION>,
      );
    case TASKS_DELETE_TASK_ACTION:
      return await deleteTaskAction(
        context,
        action.payload as ActionPayload<typeof TASKS_DELETE_TASK_ACTION>,
      );
    default:
      throw new Error("Action is invalid");
  }
}
