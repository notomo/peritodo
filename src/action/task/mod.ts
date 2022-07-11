import { setupDatastore } from "/datastore/sqlite/mod.ts";
import { listView } from "./view.ts";
import {
  newDoneTask,
  newFetchTask,
  newPersistTask,
  newRemoveTask,
} from "./impl_sqlite.ts";
import { newTextWriter } from "/lib/writer.ts";

export async function add(params: {
  name: string;
  intervalDay: number;
}) {
  const now = new Date();
  const task = {
    name: params.name,
    startAt: now,
    intervalDay: params.intervalDay,
  };

  const [datastore, teardown] = await setupDatastore();
  try {
    const persistTask = newPersistTask(datastore);
    await persistTask(task);
  } finally {
    teardown();
  }
}

export async function done(_options: void, id: number) {
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const doneTask = newDoneTask(datastore);
    await doneTask(id, now);
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
    const tasks = await fetchTask();
    await listView(tasks, write, now);
  } finally {
    teardown();
  }
}
