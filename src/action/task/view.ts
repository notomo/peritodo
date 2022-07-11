import * as typ from "./type.ts";
import { Table } from "cliffy/table";
import { format } from "datetime";

const timeFormat = "yyyy-MM-dd";
const timeColumn = (at: Date | null) => {
  if (at === null) {
    return "";
  }
  return format(at, timeFormat);
};

export async function listView(
  tasks: typ.Task[],
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
  for (const task of tasks) {
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
