import { clearDatastore } from "/datastore/sqlite/mod.ts";

export async function clear(): Promise<void> {
  await clearDatastore();
}
