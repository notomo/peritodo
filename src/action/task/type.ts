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

export function nextDate(periodicTask: PeriodicTask, now: Date): Date {
  const diff = difference(
    periodicTask.startAt,
    periodicTask.recentDoneAt || now,
    {
      units: ["days"],
    },
  );
  const elapsed = ensureNumber(diff.days);
  const remain = periodicTask.intervalDay -
    (elapsed % periodicTask.intervalDay);
  const date = new Date(now.getTime());
  date.setDate(date.getDate() + remain);
  return date;
}

export type PersistPeriodicTaskParam = Omit<
  PeriodicTask,
  "id" | "recentDoneAt"
>;
export type PersistPeriodicTask = (
  task: PersistPeriodicTaskParam,
) => Promise<void>;

export type RemovePeriodicTask = (taskId: PeriodicTaskId) => Promise<void>;

export type FetchPeriodicTasks = () => Promise<PeriodicTask[]>;

export type DoneTask = Readonly<{
  id: number;
  periodicTaskId: number;
  doneAt: Date;
  name: string;
}>;
export type DoneTaskId = DoneTask["id"];

export type PersistDoneTask = (
  taskId: PeriodicTaskId,
  now: Date,
) => Promise<void>;
export type RemoveDoneTask = (taskId: DoneTaskId) => Promise<void>;
export type FetchDoneTasks = () => Promise<DoneTask[]>;
