async function sqlToJSON(sqlPath: string, jsonPath: string) {
  const sql = await Deno.readTextFile(sqlPath);
  const json = JSON.stringify({ createTable: sql });
  await Deno.writeTextFile(jsonPath, json);
}

await sqlToJSON(Deno.args[0], Deno.args[1]);
