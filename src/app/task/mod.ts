import { setupDatastore } from "/datastore/sqlite/mod.ts";
import { addTask, listTasks } from "./action.ts";
import { newFetchTask, newPersistTask, newRemoveTask } from "./impl_sqlite.ts";
import { newTextWriter } from "/lib/writer.ts";

export async function add(params: {
  name: string;
  intervalDay: number;
}) {
  const [datastore, teardown] = await setupDatastore();
  try {
    const persistTask = newPersistTask(datastore);
    await addTask(persistTask, params.name, params.intervalDay);
  } finally {
    teardown();
  }
}

export async function remove(_options: void, id: number) {
  const [datastore, teardown] = await setupDatastore();
  try {
    const removeTask = newRemoveTask(datastore);
    await removeTask(id);
  } finally {
    teardown();
  }
}

export async function list() {
  const write = newTextWriter(Deno.stdout);
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const fetchTask = newFetchTask(datastore);
    await listTasks(fetchTask, write, now);
  } finally {
    teardown();
  }
}
