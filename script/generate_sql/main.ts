import { extractTables } from "./parse.ts";
import { generate } from "./generate.ts";

async function main(sqlPath: string, tsPath: string) {
  const sql = await Deno.readTextFile(sqlPath);
  const tables = extractTables(sql);
  generate(tsPath, tables, sql);
}

await main(Deno.args[0], Deno.args[1]);
