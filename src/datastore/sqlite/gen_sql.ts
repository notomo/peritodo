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
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id)
);
`;
export const tables = {
  periodicTask: "periodicTask",
  doneTask: "doneTask",
};

// table name: periodicTask
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

// table name: doneTask
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
