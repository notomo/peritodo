import { difference } from "datetime";
import { ensureNumber } from "unknownutil";

export type Task = {
  id: number;
  name: string;
  startAt: Date;
  intervalDay: number;
  recentDoneAt: Date | null;
};

export type TaskId = Task["id"];

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

export type DoneTask = (taskId: TaskId, now: Date) => Promise<void>;

export type FetchTasks = () => Promise<Task[]>;
