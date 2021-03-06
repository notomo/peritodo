import { extract } from "https://deno.land/x/sqlite_schema@0.0.1/mod.ts";
import { generate } from "./generate.ts";

async function main(sqlPath: string, tsPath: string) {
  const sql = await Deno.readTextFile(sqlPath);
  const tables = extract(sql).tables;
  generate(tsPath, tables, sql);
}

await main(Deno.args[0], Deno.args[1]);
