import { extractTables } from "./parse.ts";
import { generate } from "./generate.ts";

async function sqlToJSON(sqlPath: string, tsPath: string) {
  const sql = await Deno.readTextFile(sqlPath);
  const tables = extractTables(sql);
  generate(tsPath, tables, sql);
}

await sqlToJSON(Deno.args[0], Deno.args[1]);
