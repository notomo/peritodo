import { DB } from "sqlite";
import { sql } from "/datastore/sqlite/mod.ts";
import * as typ from "./type.ts";
import { format, parse } from "datetime";
import { ensureNumber, ensureString, isString } from "unknownutil";

const timeFormat = "yyyy-MM-ddTHH:mm:ss.SSS";
const tables = sql.tables;

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
    db.transaction(() => {
      sql.deleteDoneTask(db, { periodicTaskId: id });
      sql.deletePeriodicTask(db, { id: id });
    });
    return Promise.resolve();
  };
}

export function newFetchTask(db: DB): typ.FetchTasks {
  return (): Promise<typ.Task[]> => {
    const tasks = [];
    for (
      const [id, name, startAt, intervalDay, doneAt] of db.query(`
SELECT
  ${tables.periodicTask}.id
  ,${tables.periodicTask}.name
  ,${tables.periodicTask}.startAt
  ,${tables.periodicTask}.intervalDay
  ,${tables.doneTask}.doneAt
FROM ${tables.periodicTask}
LEFT JOIN ${tables.doneTask} ON ${tables.doneTask}.periodicTaskId = ${tables.periodicTask}.id
  AND NOT EXISTS (
    SELECT 1
    FROM ${tables.doneTask} done
    WHERE done.doneAt > ${tables.doneTask}.doneAt
  )
`)
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
