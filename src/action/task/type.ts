import { difference } from "datetime";
import { ensureNumber } from "unknownutil";

export type Task = Readonly<{
  id: number;
  name: string;
  startAt: Date;
  intervalDay: number;
  recentDoneAt?: Date;
}>;

export type TaskId = Task["id"];
export type TaskAt = Task["startAt"] | Task["recentDoneAt"];

export function nextDate(task: Task, now: Date): Date {
  const diff = difference(task.startAt, task.recentDoneAt || now, {
    units: ["days"],
  });
  const elapsed = ensureNumber(diff.days);
  const remain = task.intervalDay - (elapsed % task.intervalDay);
  const date = new Date(now.getTime());
  date.setDate(date.getDate() + remain);
  return date;
}

export type PersisTaskParam = Omit<Task, "id" | "recentDoneAt">;
export type PersistTask = (task: PersisTaskParam) => Promise<void>;

export type RemoveTask = (taskId: TaskId) => Promise<void>;

export type FetchTasks = () => Promise<Task[]>;

export type DoneTask = Readonly<{
  id: number;
  periodicTaskId: number;
  doneAt: Date;
  name: string;
}>;

export type PersistDoneTask = (taskId: TaskId, now: Date) => Promise<void>;
export type FetchDoneTasks = () => Promise<DoneTask[]>;
