import { difference } from "datetime";

export type Task = {
  id: number;
  name: string;
  startAt: Date;
  intervalDay: number;
};

export function nextDate(task: Task, now: Date): Date {
  const diff = difference(task.startAt, now, { units: ["days"] });
  const elapsed = diff.days as number;
  const remain = task.intervalDay - (elapsed % task.intervalDay);
  const date = new Date(now.getTime());
  date.setDate(date.getDate() + remain);
  return date;
}

export type PersistTask = (task: Omit<Task, "id">) => Promise<void>;

export type FetchTasks = () => Promise<Task[]>;
