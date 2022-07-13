export function extractTables(sql: string): Table[] {
  const tables: Table[] = [];
  let lastTable: Table = {
    name: "",
    columns: [],
  };
  for (const line of sql.split("\n")) {
    const tableMatched = line.match(
      "CREATE TABLE IF NOT EXISTS ([a-zA-Z0-9]+) \\(",
    );
    if (tableMatched) {
      const tableName = tableMatched[1];
      const table = {
        name: tableName,
        columns: [],
      };
      tables.push(table);
      lastTable = table;
      continue;
    }
    const column = extractColumn(line);
    if (!column) {
      continue;
    }
    lastTable.columns.push(column);
  }
  return tables;
}

export type Table = {
  name: string;
  columns: Column[];
};

export type Column = {
  name: string;
  isNullable: boolean;
  isAutoIncrement: boolean;
  type: string;
};

type SqliteColumnType = "INTEGER" | "TEXT" | "REAL" | "BOLB";

const columnTypes: { [K in SqliteColumnType]: string } = {
  INTEGER: "number",
  TEXT: "string",
  REAL: "number",
  BOLB: "Uint8Array",
};

function extractColumn(line: string): Column | null {
  const columnMatched = line.match("([a-zA-Z0-9]+) (INTEGER|TEXT|REAL|BOLB)");
  if (!columnMatched) {
    return null;
  }
  const columnName = columnMatched[1];
  const sqliteColumnType = columnMatched[2] as SqliteColumnType;
  const columnType = columnTypes[sqliteColumnType];
  const isNullable = line.match("NOT NULL|PRIMARY KEY") === null;
  const isAutoIncrement = line.match("AUTOINCREMENT") !== null;
  return {
    name: columnName,
    isNullable: isNullable,
    isAutoIncrement: isAutoIncrement,
    type: columnType,
  };
}
