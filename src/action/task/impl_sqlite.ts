import { DB } from "sqlite";
import { alias, sql } from "/datastore/sqlite/mod.ts";
import * as typ from "./type.ts";
import { format, parse } from "datetime";
import { ensureNumber, ensureString, isString } from "unknownutil";

const timeFormat = "yyyy-MM-ddTHH:mm:ss.SSS";

export function newPersistPeriodicTask(db: DB): typ.PersistPeriodicTask {
  return (task: typ.PersistPeriodicTaskParam): Promise<void> => {
    db.transaction(() => {
      sql.insertPeriodicTask(db, {
        name: task.name,
        startAt: format(task.startAt, timeFormat),
        intervalDay: task.intervalDay,
      });
      sql.insertPeriodicTaskStatusChange(db, {
        periodicTaskId: db.lastInsertRowId,
        changedAt: format(task.startAt, timeFormat),
        status: typ.PeriodicTaskStatusOpen,
      });
    });
    return Promise.resolve();
  };
}

export function newPerisistDoneTask(db: DB): typ.PersistDoneTask {
  return (id: typ.PeriodicTaskId, now: Date): Promise<void> => {
    sql.insertDoneTask(db, {
      periodicTaskId: id,
      doneAt: format(now, timeFormat),
    });
    return Promise.resolve();
  };
}

export function newPerisistPeriodicTaskStatusChange(
  db: DB,
): typ.PerisistPeriodicTaskClosedChange {
  return (
    id: typ.PeriodicTaskId,
    now: Date,
    status: typ.PeriodicTaskStatus,
  ): Promise<void> => {
    sql.insertPeriodicTaskStatusChange(db, {
      periodicTaskId: id,
      changedAt: format(now, timeFormat),
      status: status,
    });
    return Promise.resolve();
  };
}

export function newRemovePeriodicTask(db: DB): typ.RemovePeriodicTask {
  return (id: typ.PeriodicTaskId): Promise<void> => {
    sql.deletePeriodicTask(db, { id: id });
    return Promise.resolve();
  };
}

export function newRemoveDoneTask(db: DB): typ.RemoveDoneTask {
  return (id: typ.DoneTaskId): Promise<void> => {
    sql.deleteDoneTask(db, { id: id });
    return Promise.resolve();
  };
}

const T = sql.tables;
const C = sql.columns;

export function newFetchPeriodicTask(db: DB): typ.FetchPeriodicTasks {
  return (): Promise<typ.PeriodicTask[]> => {
    const A = {
      doneTask: "anotherDoneTask",
      periodicTaskStatusChange: "anotherPeriodicTaskStatusChange",
    };

    const selectQuery = `
SELECT
  ${C.periodicTask.id}
  ,${C.periodicTask.name}
  ,${C.periodicTask.startAt}
  ,${C.periodicTask.intervalDay}
  ,${C.doneTask.doneAt}
  ,${C.periodicTaskStatusChange.status}
FROM ${T.periodicTask}
LEFT JOIN ${T.doneTask} ON ${C.doneTask.periodicTaskId} = ${C.periodicTask.id}
  AND NOT EXISTS (
    SELECT 1
    FROM ${T.doneTask} ${A.doneTask}
    WHERE ${alias(A.doneTask, C.doneTask.doneAt)} > ${C.doneTask.doneAt}
  )
LEFT JOIN ${T.periodicTaskStatusChange} ON ${C.periodicTaskStatusChange.periodicTaskId} = ${C.periodicTask.id}
  AND NOT EXISTS (
    SELECT 1
    FROM ${T.periodicTaskStatusChange} ${A.periodicTaskStatusChange}
    WHERE ${
      alias(A.periodicTaskStatusChange, C.periodicTaskStatusChange.changedAt)
    } > ${C.periodicTaskStatusChange.changedAt}
  )
`;

    const tasks = [];
    for (
      const [
        id,
        name,
        startAt,
        intervalDay,
        doneAt,
        status,
      ] of db.query(selectQuery)
    ) {
      if (status === typ.PeriodicTaskStatusClose) {
        continue;
      }
      tasks.push({
        id: ensureNumber(id),
        name: ensureString(name),
        startAt: parse(ensureString(startAt), timeFormat),
        intervalDay: ensureNumber(intervalDay),
        recentDoneAt: isString(doneAt) ? parse(doneAt, timeFormat) : undefined,
      });
    }
    return Promise.resolve(tasks);
  };
}

export function newFetchDoneTask(db: DB): typ.FetchDoneTasks {
  return (): Promise<typ.DoneTask[]> => {
    const selectQuery = `
SELECT
  ${C.doneTask.id}
  ,${C.doneTask.periodicTaskId}
  ,${C.doneTask.doneAt}
  ,${C.periodicTask.name}
FROM ${T.doneTask}
INNER JOIN ${T.periodicTask} ON ${C.periodicTask.id} = ${C.doneTask.periodicTaskId}
`;

    const doneTasks = [];
    for (
      const [
        id,
        periodicTaskId,
        doneAt,
        name,
      ] of db.query(selectQuery)
    ) {
      doneTasks.push({
        id: ensureNumber(id),
        periodicTaskId: ensureNumber(periodicTaskId),
        name: ensureString(name),
        doneAt: parse(ensureString(doneAt), timeFormat),
      });
    }
    return Promise.resolve(doneTasks);
  };
}
