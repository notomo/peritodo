import { clearDatastore, setupDatastore } from "/datastore/sqlite/mod.ts";
import * as view from "./view.ts";
import * as impl from "./impl_sqlite.ts";
import { newTextWriter } from "/lib/writer.ts";

export async function clear(): Promise<void> {
  await clearDatastore();
}

export async function show(): Promise<void> {
  const write = newTextWriter(Deno.stdout);

  const [datastore, teardown] = await setupDatastore();
  try {
    const tables = impl.fetchTables(datastore);
    await view.all(tables, write);
  } finally {
    teardown();
  }
}
