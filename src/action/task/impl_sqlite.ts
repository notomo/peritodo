import { DB } from "sqlite";
import { alias, sql } from "/datastore/sqlite/mod.ts";
import * as typ from "./type.ts";
import { format, parse } from "datetime";
import { ensureNumber, ensureString, isString } from "unknownutil";

const timeFormat = "yyyy-MM-ddTHH:mm:ss.SSS";

export function newPersistTask(db: DB): typ.PersistTask {
  return (task: typ.PersisTaskParam): Promise<void> => {
    sql.insertPeriodicTask(db, {
      name: task.name,
      startAt: format(task.startAt, timeFormat),
      intervalDay: task.intervalDay,
    });
    return Promise.resolve();
  };
}

export function newDoneTask(db: DB): typ.DoneTask {
  return (id: typ.TaskId, now: Date): Promise<void> => {
    sql.insertDoneTask(db, {
      periodicTaskId: id,
      doneAt: format(now, timeFormat),
    });
    return Promise.resolve();
  };
}

export function newRemoveTask(db: DB): typ.RemoveTask {
  return (id: typ.TaskId): Promise<void> => {
    sql.deletePeriodicTask(db, { id: id });
    return Promise.resolve();
  };
}

const T = sql.tables;
const C = sql.columns;

export function newFetchTask(db: DB): typ.FetchTasks {
  return (): Promise<typ.Task[]> => {
    const tasks = [];

    const doneTaskAlias = "anotherDoneTask";
    const selectQuery = `
SELECT
  ${C.periodicTask.id}
  ,${C.periodicTask.name}
  ,${C.periodicTask.startAt}
  ,${C.periodicTask.intervalDay}
  ,${C.doneTask.doneAt}
FROM ${T.periodicTask}
LEFT JOIN ${T.doneTask} ON ${C.doneTask.periodicTaskId} = ${C.periodicTask.id}
  AND NOT EXISTS (
    SELECT 1
    FROM ${T.doneTask} ${doneTaskAlias}
    WHERE ${alias(doneTaskAlias, C.doneTask.doneAt)} > ${C.doneTask.doneAt}
  )
`;

    for (
      const [
        id,
        name,
        startAt,
        intervalDay,
        doneAt,
      ] of db.query(selectQuery)
    ) {
      const task: typ.Task = {
        id: ensureNumber(id),
        name: ensureString(name),
        startAt: parse(ensureString(startAt), timeFormat),
        intervalDay: ensureNumber(intervalDay),
        recentDoneAt: null,
      };
      if (isString(doneAt)) {
        task.recentDoneAt = parse(doneAt, timeFormat);
      }
      tasks.push(task);
    }
    return Promise.resolve(tasks);
  };
}
