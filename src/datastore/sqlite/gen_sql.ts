import { DB } from "sqlite";
import { asConditionPart } from "./builder.ts";

export const createTable = `CREATE TABLE IF NOT EXISTS periodicTask (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(name != ''),
  startAt TEXT NOT NULL,
  intervalDay INTEGER CHECK(intervalDay > 0)
);

CREATE TABLE IF NOT EXISTS doneTask (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodicTaskId INTEGER NOT NULL,
  doneAt TEXT NOT NULL,
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
);
`;

export const tables = {
  periodicTask: "periodicTask",
  doneTask: "doneTask",
} as const;

export const columns = {
  periodicTask: {
    id: "periodicTask.id",
    name: "periodicTask.name",
    startAt: "periodicTask.startAt",
    intervalDay: "periodicTask.intervalDay",
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
