import * as typ from "./type.ts";
import { Table } from "cliffy/table";
import { format } from "datetime";
import { edit } from "/lib/editor.ts";

export type OutputterType = "table" | "json";

type Renderers<T> = { [K in OutputterType]: (tasks: T[]) => string };

const timeFormat = "yyyy-MM-dd";
const timeColumn = (at: typ.PeriodicTaskAt) => {
  if (at === undefined) {
    return "";
  }
  return format(at, timeFormat);
};

export function periodicTaskViews(
  periodicTasks: typ.PeriodicTask[],
  now: Date,
): typ.PeriodicTaskView[] {
  return periodicTasks.map((task) => {
    const nextAt = typ.nextDate(task, now);
    return {
      id: task.id,
      name: task.name,
      nextAt: timeColumn(nextAt),
      startAt: timeColumn(task.startAt),
      intervalDay: task.intervalDay,
      recentDoneAt: timeColumn(task.recentDoneAt),
    };
  });
}

export const renderPeriodicTasks: Renderers<typ.PeriodicTaskView> = {
  ["table"]: (
    tasks: typ.PeriodicTaskView[],
  ): string => {
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
      table.push([
        task.id,
        task.name,
        task.nextAt,
        task.startAt,
        task.intervalDay,
        task.recentDoneAt,
      ]);
    }
    return table.toString();
  },
  ["json"]: (
    tasks: typ.PeriodicTaskView[],
  ): string => {
    return JSON.stringify(tasks, null, 2);
  },
};

export function doneTaskViews(
  doneTasks: typ.DoneTask[],
): typ.DoneTaskView[] {
  return doneTasks.map((task) => {
    return {
      id: task.id,
      periodicTaskId: task.periodicTaskId,
      name: task.name,
      doneAt: timeColumn(task.doneAt),
    };
  });
}

export const renderDoneTasks: Renderers<typ.DoneTaskView> = {
  ["table"]: (
    tasks: typ.DoneTaskView[],
  ): string => {
    const table = new Table().header([
      "Id",
      "Periodic task id",
      "Name",
      "Done at",
    ]).border(
      true,
    );
    for (const task of tasks) {
      table.push([
        task.id,
        task.periodicTaskId,
        task.name,
        task.doneAt,
      ]);
    }
    return table.toString();
  },
  ["json"]: (
    tasks: typ.DoneTaskView[],
  ): string => {
    return JSON.stringify(tasks, null, 2);
  },
};

export async function editPeriodicTasks(
  periodicTasks: typ.PeriodicTask[],
): Promise<typ.EditedPeriodicTask[] | undefined> {
  const editableTasks = periodicTasks.map((e) => {
    return {
      id: e.id,
      name: e.name,
      intervalDay: e.intervalDay,
    };
  });
  const input = new TextEncoder().encode(
    JSON.stringify(editableTasks, null, 2),
  );
  const output = await edit(input);
  if (!output) {
    return undefined;
  }
  return JSON.parse(output);
}
