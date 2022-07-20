import { sql } from "/datastore/sqlite/mod.ts";

export type TableName = (typeof sql.tables)[keyof typeof sql.tables];
export type TableRow = (string | number)[];

export type Table = {
  name: TableName;
  rows: TableRow[];
  columnNames: string[];
};
