import { setupDatastore } from "/datastore/sqlite/mod.ts";
import { listView } from "./view.ts";
import * as impl from "./impl_sqlite.ts";
import * as typ from "./type.ts";
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
    const persistTask = impl.newPersistTask(datastore);
    await persistTask(task);
  } finally {
    teardown();
  }
}

export async function done(_options: void, id: typ.TaskId) {
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const doneTask = impl.newDoneTask(datastore);
    await doneTask(id, now);
  } finally {
    teardown();
  }
}

export async function remove(_options: void, id: typ.TaskId) {
  const [datastore, teardown] = await setupDatastore();
  try {
    const removeTask = impl.newRemoveTask(datastore);
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
    const fetchTask = impl.newFetchTask(datastore);
    const tasks = await fetchTask();
    await listView(tasks, write, now);
  } finally {
    teardown();
  }
}
