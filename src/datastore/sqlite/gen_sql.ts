import { DB } from "sqlite";
import { asConditionPart } from "./builder.ts";

export const createTable = `CREATE TABLE IF NOT EXISTS periodicTask (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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

DROP TRIGGER IF EXISTS checkPeriodicTaskStatusChange;
CREATE TRIGGER IF NOT EXISTS checkPeriodicTaskStatusChange
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodicTaskId INTEGER NOT NULL,
  doneAt TEXT NOT NULL,
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
);
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

export type InsertPeriodicTaskParams = {
  name: string;
  startAt: string;
  intervalDay: number;
};

export function insertPeriodicTask(db: DB, params: InsertPeriodicTaskParams) {
  db.query(
    `
INSERT INTO periodicTask (
  name
  ,startAt
  ,intervalDay
) VALUES (
  :name
  ,:startAt
  ,:intervalDay
)`,
    params,
  );
}

export type DeletePeriodicTaskParams = {
  id: number;
  name: string;
  startAt: string;
  intervalDay: number;
};

export function deletePeriodicTask(
  db: DB,
  params: Partial<DeletePeriodicTaskParams>,
) {
  const condition = asConditionPart(params);
  const query = `DELETE FROM periodicTask WHERE ${condition}`;
  db.query(query, params);
}

export type InsertPeriodicTaskStatusChangeParams = {
  periodicTaskId: number;
  changedAt: string;
  status: string;
};

export function insertPeriodicTaskStatusChange(
  db: DB,
  params: InsertPeriodicTaskStatusChangeParams,
) {
  db.query(
    `
INSERT INTO periodicTaskStatusChange (
  periodicTaskId
  ,changedAt
  ,status
) VALUES (
  :periodicTaskId
  ,:changedAt
  ,:status
)`,
    params,
  );
}

export type DeletePeriodicTaskStatusChangeParams = {
  periodicTaskId: number;
  changedAt: string;
  status: string;
};

export function deletePeriodicTaskStatusChange(
  db: DB,
  params: Partial<DeletePeriodicTaskStatusChangeParams>,
) {
  const condition = asConditionPart(params);
  const query = `DELETE FROM periodicTaskStatusChange WHERE ${condition}`;
  db.query(query, params);
}

export type InsertDoneTaskParams = {
  periodicTaskId: number;
  doneAt: string;
};

export function insertDoneTask(db: DB, params: InsertDoneTaskParams) {
  db.query(
    `
INSERT INTO doneTask (
  periodicTaskId
  ,doneAt
) VALUES (
  :periodicTaskId
  ,:doneAt
)`,
    params,
  );
}

export type DeleteDoneTaskParams = {
  id: number;
  periodicTaskId: number;
  doneAt: string;
};

export function deleteDoneTask(db: DB, params: Partial<DeleteDoneTaskParams>) {
  const condition = asConditionPart(params);
  const query = `DELETE FROM doneTask WHERE ${condition}`;
  db.query(query, params);
}
