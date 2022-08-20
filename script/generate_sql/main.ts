import { extract } from "https://deno.land/x/sqlite_schema@0.0.3/mod.ts";
import { generate } from "./generate.ts";

async function main(sqlPath: string, tsPath: string) {
  const sql = await Deno.readTextFile(sqlPath);
  const tables = extract(sql).tables;
  await generate(tsPath, tables, sql);
}

await main(Deno.args[0], Deno.args[1]);
