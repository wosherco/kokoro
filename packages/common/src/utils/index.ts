import { TZDateMini } from "@date-fns/tz";
import { set } from "date-fns";

export const handleDateOrDatetime = (date: string | Date, isStart: boolean) => {
  if (typeof date === "string") {
    return set(
      new TZDateMini(date),
      isStart
        ? { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }
        : { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 },
    );
  }

  return new TZDateMini(date);
};
