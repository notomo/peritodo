import * as typ from "./type.ts";
import { Table } from "cliffy/table";
import { format } from "datetime";

const timeFormat = "yyyy-MM-dd";
const timeColumn = (at: typ.PeriodicTaskAt) => {
  if (at === undefined) {
    return "";
  }
  return format(at, timeFormat);
};

export async function listPeriodicTasks(
  periodicTasks: typ.PeriodicTask[],
  write: (output: string) => Promise<void>,
  now: Date,
): Promise<void> {
  const table = new Table().header([
    "Id",
    "Name",
    "Next at",
    "Start at",
    "Interval days",
    "Done at",
  ]).border(
    true,
  );
  for (const task of periodicTasks) {
    const nextAt = typ.nextDate(task, now);
    table.push([
      task.id,
      task.name,
      timeColumn(nextAt),
      timeColumn(task.startAt),
      task.intervalDay,
      timeColumn(task.recentDoneAt),
    ]);
  }
  const output = table.toString();
  await write(output);
}

export async function listDoneTasks(
  doneTasks: typ.DoneTask[],
  write: (output: string) => Promise<void>,
): Promise<void> {
  const table = new Table().header([
    "Id",
    "Periodic task id",
    "Name",
    "Done at",
  ]).border(
    true,
  );
  for (const task of doneTasks) {
    table.push([
      task.id,
      task.periodicTaskId,
      task.name,
      timeColumn(task.doneAt),
    ]);
  }
  const output = table.toString();
  await write(output);
}
