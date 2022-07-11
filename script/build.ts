async function sqlToJSON(sqlPath: string, jsonPath: string) {
  const sql = await Deno.readTextFile(sqlPath);
  const json = JSON.stringify(
    {
      createTable: sql,
      tables: extractTables(sql),
    },
    null,
    2,
  );
  await Deno.writeTextFile(jsonPath, json);
}

function extractTables(sql: string) {
  const tables = new Map<string, string>();
  for (const line of sql.split("\n")) {
    const matched = line.match("CREATE TABLE IF NOT EXISTS ([a-zA-Z0-9]+) \\(");
    if (matched) {
      const tableName = matched[1];
      tables.set(tableName, tableName);
    }
  }
  return Object.fromEntries(tables);
}

await sqlToJSON(Deno.args[0], Deno.args[1]);
