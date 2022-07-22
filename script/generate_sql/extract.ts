import { DB, Row } from "https://deno.land/x/sqlite@v3.4.0/mod.ts";

export type Table = Readonly<{
  name: string;
  columns: Column[];
}>;

export type Column = Readonly<{
  name: string;
  isNullable: boolean;
  isAutoIncrement: boolean;
  type: string;
}>;

type SqliteColumnType = "INTEGER" | "TEXT" | "REAL" | "BOLB";

const columnTypes: { [K in SqliteColumnType]: string } = {
  INTEGER: "number",
  TEXT: "string",
  REAL: "number",
  BOLB: "Uint8Array",
};

function fetchTable(db: DB, tableName: string, tableSQL: string): Table {
  const query = db.prepareQuery<
    Row,
    {
      name: string;
      type: SqliteColumnType;
      notnull: 0 | 1;
    }
  >(
    `PRAGMA table_info("${tableName}")`,
  );
  const table = {
    name: tableName,
    columns: query.allEntries().map((e) => {
      return {
        name: e.name,
        isNullable: e.notnull === 0,
        isAutoIncrement:
          tableSQL.match(`${e.name} [^,]+AUTOINCREMENT`) !== null,
        type: columnTypes[e.type],
      };
    }),
  };
  query.finalize();
  return table;
}

function fetchTables(db: DB, sql: string): Table[] {
  db.execute(sql);

  const query = db.prepareQuery<Row, { name: string; sql: string }>(
    `SELECT name, sql FROM sqlite_schema WHERE type = 'table'`,
  );
  const tables = query.allEntries()
    .filter((e) => !e.name.startsWith("sqlite_"))
    .map((e) => fetchTable(db, e.name, e.sql));
  query.finalize();
  return tables;
}

export function extractTables(sql: string): Table[] {
  const db = new DB();
  try {
    return fetchTables(db, sql);
  } finally {
    db.close();
  }
}
