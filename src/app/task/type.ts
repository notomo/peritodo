import { difference } from "datetime";
import { ensureNumber } from "unknownutil";

export type Task = {
  id: number;
  name: string;
  startAt: Date;
  intervalDay: number;
};

export function nextDate(task: Task, now: Date): Date {
  const diff = difference(task.startAt, now, { units: ["days"] });
  const elapsed = ensureNumber(diff.days);
  const remain = task.intervalDay - (elapsed % task.intervalDay);
  const date = new Date(now.getTime());
  date.setDate(date.getDate() + remain);
  return date;
}

export type PersistTask = (task: Omit<Task, "id">) => Promise<void>;

export type FetchTasks = () => Promise<Task[]>;
