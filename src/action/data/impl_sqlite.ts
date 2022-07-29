import { DB, sql } from "/datastore/sqlite/mod.ts";
import * as typ from "./type.ts";

function fetchTable(db: DB, tableName: typ.TableName): typ.Table {
  const query = db.prepareQuery<typ.TableRow>(
    `SELECT * FROM ${tableName}`,
  );
  const table = {
    name: tableName,
    columnNames: query.columns().map((column) => column.name),
    rows: query.all(),
  };

  query.finalize();

  return table;
}

export function fetchTables(db: DB): typ.Table[] {
  return Object.values(sql.tables).map((tableName) => {
    return fetchTable(db, tableName);
  });
}
