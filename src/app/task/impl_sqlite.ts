import { DB } from "sqlite";
import { FetchTasks, PersistTask, Task } from "./type.ts";
import { format, parse } from "datetime";

const timeFormat = "yyyy-MM-ddTHH:mm:ss.SSS";

export function newPersistTask(db: DB): PersistTask {
  return (task: Omit<Task, "id">): Promise<void> => {
    db.query(
      `
INSERT INTO periodic_task (
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

export function newFetchTask(db: DB): FetchTasks {
  return (): Promise<Task[]> => {
    const tasks = [];
    for (
      const [id, name, startAt, intervalDay] of db.query(`
SELECT
  id
  ,name
  ,startAt
  ,intervalDay
FROM periodic_task
`)
    ) {
      tasks.push({
        id: id as number,
        name: name as string,
        startAt: parse(startAt as string, timeFormat),
        intervalDay: intervalDay as number,
      });
    }
    return Promise.resolve(tasks);
  };
}
