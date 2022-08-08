import { alias, DB, sql, SqliteError } from "/datastore/sqlite/mod.ts";
import * as typ from "./type.ts";
import { format, parse } from "datetime";
import { ensureNumber, ensureString, isString } from "unknownutil";

const timeFormat = "yyyy-MM-ddTHH:mm:ss.SSS";

export function persistPeriodicTask(
  db: DB,
  task: typ.PersistPeriodicTaskParam,
): Promise<typ.PeriodicTask> {
  return new Promise((resolve) => {
    db.transaction(() => {
      sql.insertPeriodicTask(db, {
        name: task.name,
        startAt: format(task.startAt, timeFormat),
        intervalDay: task.intervalDay,
      });

      const periodicTaskId = db.lastInsertRowId;
      perisistPeriodicTaskStatusChange(db, {
        periodicTaskId: periodicTaskId,
        at: task.startAt,
        status: typ.PeriodicTaskStatusOpen,
      });

      resolve({
        id: periodicTaskId,
        name: task.name,
        startAt: task.startAt,
        intervalDay: task.intervalDay,
      });
    });
  });
}

export function perisistDoneTask(
  db: DB,
  doneTask: typ.PersistDoneTaskParam,
): Promise<void> {
  sql.insertDoneTask(db, {
    periodicTaskId: doneTask.periodicTaskId,
    doneAt: format(doneTask.doneAt, timeFormat),
  });
  return Promise.resolve();
}

const alreadyChanged = "status is already changed";

export function perisistPeriodicTaskStatusChange(
  db: DB,
  change: typ.PeriodicTaskClosedChange,
): Promise<void> {
  try {
    sql.insertPeriodicTaskStatusChange(db, {
      periodicTaskId: change.periodicTaskId,
      changedAt: format(change.at, timeFormat),
      status: change.status,
    });
  } catch (error) {
    if (error instanceof SqliteError && error.message == alreadyChanged) {
      return Promise.resolve();
    }
    throw error;
  }
  return Promise.resolve();
}

export function removePeriodicTask(
  db: DB,
  id: typ.PeriodicTaskId,
): Promise<void> {
  sql.deletePeriodicTask(db, { id: id });
  return Promise.resolve();
}

export function removeDoneTask(
  db: DB,
  id: typ.DoneTaskId,
): Promise<void> {
  sql.deleteDoneTask(db, { id: id });
  return Promise.resolve();
}

const T = sql.tables;
const C = sql.columns;

export function fetchPeriodicTasks(db: DB): Promise<typ.PeriodicTask[]> {
  const A = {
    doneTask: "anotherDoneTask",
    periodicTaskStatusChange: "anotherPeriodicTaskStatusChange",
  };

  const selectQuery = `SELECT
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
  )`;

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
}

export function fetchDoneTasks(db: DB): Promise<typ.DoneTask[]> {
  const selectQuery = `SELECT
  ${C.doneTask.id}
  ,${C.doneTask.periodicTaskId}
  ,${C.doneTask.doneAt}
  ,${C.periodicTask.name}
FROM ${T.doneTask}
INNER JOIN ${T.periodicTask} ON ${C.periodicTask.id} = ${C.doneTask.periodicTaskId}`;

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
}

export function replacePeriodicTasks(
  db: DB,
  newTasks: typ.EditedPeriodicTask[],
  oldTasks: typ.PeriodicTask[],
): Promise<void> {
  // TODO id matching
  let i = -1;
  const tasks = newTasks.map((e) => {
    i++;
    return {
      ...e,
      startAt: format(oldTasks[i].startAt, timeFormat),
    };
  });
  sql.replacePeriodicTask(db, ...tasks);
  return Promise.resolve();
}
