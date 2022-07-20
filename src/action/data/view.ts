import * as typ from "./type.ts";
import { Table } from "cliffy/table";

export async function all(
  tables: typ.Table[],
  write: (output: string) => Promise<void>,
) {
  for (const table of tables) {
    await one(table, write);
    await write("\n");
  }
}

async function one(
  inspectedTable: typ.Table,
  write: (output: string) => Promise<void>,
): Promise<void> {
  const table = new Table().header(inspectedTable.columnNames).border(true);
  table.push(...inspectedTable.rows);

  await write(inspectedTable.name + "\n");
  await write(table.toString() + "\n");
}
