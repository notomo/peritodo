import { DB } from "sqlite";
import { DoneTask, FetchTasks, PersistTask, RemoveTask, Task } from "./type.ts";
import { format, parse } from "datetime";
import { ensureNumber, ensureString, isString } from "unknownutil";

const timeFormat = "yyyy-MM-ddTHH:mm:ss.SSS";

const tables = {
  periodic_task: "periodic_task",
  done_task: "done_task",
};

export function newPersistTask(db: DB): PersistTask {
  return (task: Omit<Task, "id" | "doneAt">): Promise<void> => {
    db.query(
      `
INSERT INTO ${tables.periodic_task} (
  name
  ,startAt
  ,intervalDay
) VALUES (?, ?, ?)
`,
      [
        task.name,
        format(task.startAt, timeFormat),
        task.intervalDay,
      ],
    );
    return Promise.resolve();
  };
}

export function newDoneTask(db: DB): DoneTask {
  return (id: number, now: Date): Promise<void> => {
    db.query(
      `
INSERT INTO ${tables.done_task} (
  periodicTaskId
  ,doneAt
) VALUES (?, ?)
`,
      [
        id,
        format(now, timeFormat),
      ],
    );
    return Promise.resolve();
  };
}

export function newRemoveTask(db: DB): RemoveTask {
  return (id: number): Promise<void> => {
    db.query(
      `
DELETE FROM ${tables.periodic_task} WHERE id = ?
`,
      [
        id,
      ],
    );
    return Promise.resolve();
  };
}

export function newFetchTask(db: DB): FetchTasks {
  return (): Promise<Task[]> => {
    const tasks = [];
    for (
      const [id, name, startAt, intervalDay, doneAt] of db.query(`
SELECT
  ${tables.periodic_task}.id
  ,${tables.periodic_task}.name
  ,${tables.periodic_task}.startAt
  ,${tables.periodic_task}.intervalDay
  ,${tables.done_task}.doneAt
FROM ${tables.periodic_task}
LEFT JOIN ${tables.done_task} ON ${tables.done_task}.periodicTaskId = ${tables.periodic_task}.id
  AND NOT EXISTS (
    SELECT 1
    FROM ${tables.done_task} done
    WHERE done.doneAt > ${tables.done_task}.doneAt
  )
`)
    ) {
      const task: Task = {
        id: ensureNumber(id),
        name: ensureString(name),
        startAt: parse(ensureString(startAt), timeFormat),
        intervalDay: ensureNumber(intervalDay),
        doneAt: null,
      };
      if (isString(doneAt)) {
        task.doneAt = parse(doneAt, timeFormat);
      }
      tasks.push(task);
    }
    return Promise.resolve(tasks);
  };
}
