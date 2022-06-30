import { FetchTasks, nextDate, PersistTask } from "./type.ts";
import { Table } from "cliffy/table";
import { format } from "datetime";

export function addTask(
  persist: PersistTask,
  name: string,
  intervalDay: number,
): Promise<void> {
  const task = {
    name: name,
    startAt: new Date(),
    intervalDay: intervalDay,
  };
  return persist(task);
}

const timeFormat = "yyyy-MM-dd";

export async function listTasks(
  fetcher: FetchTasks,
  write: (output: string) => Promise<void>,
  now: Date,
): Promise<void> {
  const tasks = await fetcher();
  const table = new Table().header([
    "Name",
    "Next at",
    "Start at",
    "Interval days",
  ]).border(
    true,
  );
  for (const task of tasks) {
    const nextAt = nextDate(task, now);
    table.push([
      task.name,
      format(nextAt, timeFormat),
      format(task.startAt, timeFormat),
      task.intervalDay,
    ]);
  }
  const output = table.toString();
  return write(output);
}
