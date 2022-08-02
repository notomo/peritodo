import { difference } from "datetime";
import { ensureNumber } from "unknownutil";

export type PeriodicTask = Readonly<{
  id: number;
  name: string;
  startAt: Date;
  intervalDay: number;
  recentDoneAt?: Date;
}>;

export type PeriodicTaskId = PeriodicTask["id"];
export type PeriodicTaskAt =
  | PeriodicTask["startAt"]
  | PeriodicTask["recentDoneAt"];

function addDay(date: Date, day: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + day);
  return d;
}

function isInRange(range: [Date, Date], at?: Date) {
  if (at === undefined) {
    return false;
  }
  return range[0] <= at && at < range[1];
}

function makeCurrentRange(
  startAt: Date,
  now: Date,
  intervalDay: number,
): [Date, Date] {
  const diffDay = ensureNumber(
    difference(startAt, now, { units: ["days"] }).days,
  );
  const elapsedDay = Math.floor(diffDay / intervalDay);
  const start = addDay(startAt, intervalDay * elapsedDay);
  const end = addDay(start, intervalDay);
  return [start, end];
}

function slideRange(range: [Date, Date]): [Date, Date] {
  const intervalDay = ensureNumber(
    difference(range[0], range[1], { units: ["days"] })
      .days,
  );
  const start = addDay(range[0], intervalDay);
  const end = addDay(start, intervalDay);
  return [start, end];
}

export function nextDate(periodicTask: PeriodicTask, now: Date): Date {
  const range = makeCurrentRange(
    periodicTask.startAt,
    now,
    periodicTask.intervalDay,
  );
  if (isInRange(range, periodicTask.recentDoneAt)) {
    return slideRange(range)[1];
  }
  const nextRange = isInRange(range, periodicTask.recentDoneAt)
    ? slideRange(range)
    : range;
  const end = nextRange[1];
  return end;
}

export type PersistPeriodicTaskParam = Omit<
  PeriodicTask,
  "id" | "recentDoneAt"
>;

export type DoneTask = Readonly<{
  id: number;
  periodicTaskId: number;
  doneAt: Date;
  name: string;
}>;
export type DoneTaskId = DoneTask["id"];

export type PersistDoneTaskParam = Omit<DoneTask, "id" | "name">;

export const PeriodicTaskStatusOpen = "open" as const;
export const PeriodicTaskStatusClose = "close" as const;
export type PeriodicTaskStatus =
  | typeof PeriodicTaskStatusOpen
  | typeof PeriodicTaskStatusClose;

export type PeriodicTaskClosedChange = Readonly<{
  periodicTaskId: number;
  at: Date;
  status: PeriodicTaskStatus;
}>;
