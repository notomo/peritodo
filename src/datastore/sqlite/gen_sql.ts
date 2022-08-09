import { DB } from "./db.ts";
import { asConditionPart, asIntoValues } from "./builder.ts";

export const createTable = `CREATE TABLE IF NOT EXISTS periodicTask (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(name != ''),
  startAt TEXT NOT NULL,
  intervalDay INTEGER CHECK(intervalDay > 0)
);

CREATE TABLE IF NOT EXISTS periodicTaskStatusChange (
  periodicTaskId INTEGER NOT NULL,
  changedAt TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open', 'close')),
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS periodicTaskStatusChange_periodicTaskId ON periodicTaskStatusChange(periodicTaskId);

DROP TRIGGER IF EXISTS periodicTaskStatusChange_checkStatus;
CREATE TRIGGER IF NOT EXISTS periodicTaskStatusChange_checkStatus
BEFORE INSERT ON periodicTaskStatusChange
BEGIN
  SELECT RAISE(FAIL, 'status is already changed')
  FROM periodicTaskStatusChange
  WHERE
    periodicTaskStatusChange.periodicTaskId = NEW.periodicTaskId
    AND periodicTaskStatusChange.status = NEW.status
    AND NOT EXISTS (
      SELECT 1
      FROM periodicTaskStatusChange another
      WHERE
        periodicTaskStatusChange.periodicTaskId = NEW.periodicTaskId
        AND another.periodicTaskId = NEW.periodicTaskId
        AND another.changedAt > periodicTaskStatusChange.changedAt
    );
END;

CREATE TABLE IF NOT EXISTS doneTask (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  periodicTaskId INTEGER NOT NULL,
  doneAt TEXT NOT NULL,
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS doneTask_periodicTaskId ON doneTask(periodicTaskId);
`;

export const tables = {
  periodicTask: "periodicTask",
  periodicTaskStatusChange: "periodicTaskStatusChange",
  doneTask: "doneTask",
} as const;

export const columns = {
  periodicTask: {
    id: "periodicTask.id",
    name: "periodicTask.name",
    startAt: "periodicTask.startAt",
    intervalDay: "periodicTask.intervalDay",
  },
  periodicTaskStatusChange: {
    periodicTaskId: "periodicTaskStatusChange.periodicTaskId",
    changedAt: "periodicTaskStatusChange.changedAt",
    status: "periodicTaskStatusChange.status",
  },
  doneTask: {
    id: "doneTask.id",
    periodicTaskId: "doneTask.periodicTaskId",
    doneAt: "doneTask.doneAt",
  },
} as const;

export type AllColumns =
  | "periodicTask.id"
  | "periodicTask.name"
  | "periodicTask.startAt"
  | "periodicTask.intervalDay"
  | "periodicTaskStatusChange.periodicTaskId"
  | "periodicTaskStatusChange.changedAt"
  | "periodicTaskStatusChange.status"
  | "doneTask.id"
  | "doneTask.periodicTaskId"
  | "doneTask.doneAt";

export const periodicTaskColumns = ["id", "name", "startAt", "intervalDay"];

export type InsertPeriodicTaskParams = Readonly<{
  name: string;
  startAt: string;
  intervalDay: number;
}>;

export function insertPeriodicTask(
  db: DB,
  ...paramsList: InsertPeriodicTaskParams[]
) {
  const [values, params] = asIntoValues(paramsList, periodicTaskColumns);
  const query =
    `INSERT INTO periodicTask (name, startAt, intervalDay) VALUES ${values}`;
  db.query(query, params);
}

export type ReplacePeriodicTaskParams = Readonly<{
  id: number;
  name?: string;
  startAt?: string;
  intervalDay?: number;
}>;

export function replacePeriodicTask(
  db: DB,
  ...paramsList: ReplacePeriodicTaskParams[]
) {
  const [values, params] = asIntoValues(paramsList, periodicTaskColumns);
  const query =
    `REPLACE INTO periodicTask (id, name, startAt, intervalDay) VALUES ${values}`;
  db.query(query, params);
}

export type DeletePeriodicTaskParams = Partial<
  Readonly<{
    id: number;
    name: string;
    startAt: string;
    intervalDay: number;
  }>
>;

export function deletePeriodicTask(db: DB, params: DeletePeriodicTaskParams) {
  const condition = asConditionPart(params);
  const query = `DELETE FROM periodicTask WHERE ${condition}`;
  db.query(query, params);
}

export const periodicTaskStatusChangeColumns = [
  "periodicTaskId",
  "changedAt",
  "status",
];

export type InsertPeriodicTaskStatusChangeParams = Readonly<{
  periodicTaskId: number;
  changedAt: string;
  status: string;
}>;

export function insertPeriodicTaskStatusChange(
  db: DB,
  ...paramsList: InsertPeriodicTaskStatusChangeParams[]
) {
  const [values, params] = asIntoValues(
    paramsList,
    periodicTaskStatusChangeColumns,
  );
  const query =
    `INSERT INTO periodicTaskStatusChange (periodicTaskId, changedAt, status) VALUES ${values}`;
  db.query(query, params);
}

export type ReplacePeriodicTaskStatusChangeParams = Readonly<{
  periodicTaskId?: number;
  changedAt?: string;
  status?: string;
}>;

export function replacePeriodicTaskStatusChange(
  db: DB,
  ...paramsList: ReplacePeriodicTaskStatusChangeParams[]
) {
  const [values, params] = asIntoValues(
    paramsList,
    periodicTaskStatusChangeColumns,
  );
  const query =
    `REPLACE INTO periodicTaskStatusChange (periodicTaskId, changedAt, status) VALUES ${values}`;
  db.query(query, params);
}

export type DeletePeriodicTaskStatusChangeParams = Partial<
  Readonly<{
    periodicTaskId: number;
    changedAt: string;
    status: string;
  }>
>;

export function deletePeriodicTaskStatusChange(
  db: DB,
  params: DeletePeriodicTaskStatusChangeParams,
) {
  const condition = asConditionPart(params);
  const query = `DELETE FROM periodicTaskStatusChange WHERE ${condition}`;
  db.query(query, params);
}

export const doneTaskColumns = ["id", "periodicTaskId", "doneAt"];

export type InsertDoneTaskParams = Readonly<{
  periodicTaskId: number;
  doneAt: string;
}>;

export function insertDoneTask(db: DB, ...paramsList: InsertDoneTaskParams[]) {
  const [values, params] = asIntoValues(paramsList, doneTaskColumns);
  const query =
    `INSERT INTO doneTask (periodicTaskId, doneAt) VALUES ${values}`;
  db.query(query, params);
}

export type ReplaceDoneTaskParams = Readonly<{
  id: number;
  periodicTaskId?: number;
  doneAt?: string;
}>;

export function replaceDoneTask(
  db: DB,
  ...paramsList: ReplaceDoneTaskParams[]
) {
  const [values, params] = asIntoValues(paramsList, doneTaskColumns);
  const query =
    `REPLACE INTO doneTask (id, periodicTaskId, doneAt) VALUES ${values}`;
  db.query(query, params);
}

export type DeleteDoneTaskParams = Partial<
  Readonly<{
    id: number;
    periodicTaskId: number;
    doneAt: string;
  }>
>;

export function deleteDoneTask(db: DB, params: DeleteDoneTaskParams) {
  const condition = asConditionPart(params);
  const query = `DELETE FROM doneTask WHERE ${condition}`;
  db.query(query, params);
}
