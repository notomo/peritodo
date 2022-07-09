import { setupDatastore } from "/datastore/sqlite/mod.ts";
import { addTask, listTasks } from "./action.ts";
import { newFetchTask, newPersistTask } from "./impl_sqlite.ts";
import { newTextWriter } from "/lib/writer.ts";

export async function add(options: {
  name: string;
  intervalDay: number;
}) {
  const [datastore, teardown] = await setupDatastore();
  try {
    const persistTask = newPersistTask(datastore);
    await addTask(persistTask, options.name, options.intervalDay);
  } finally {
    teardown();
  }
}

export async function list() {
  const [datastore, teardown] = await setupDatastore();
  try {
    const fetchTask = newFetchTask(datastore);
    const write = newTextWriter(Deno.stdout);
    const now = new Date();
    await listTasks(fetchTask, write, now);
  } finally {
    teardown();
  }
}
