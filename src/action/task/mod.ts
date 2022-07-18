import { setupDatastore } from "/datastore/sqlite/mod.ts";
import * as view from "./view.ts";
import * as impl from "./impl_sqlite.ts";
import * as typ from "./type.ts";
import { newTextWriter } from "/lib/writer.ts";

export async function addPeriodicTask(params: {
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
    const persistTask = impl.newPersistPeriodicTask(datastore);
    await persistTask(task);
  } finally {
    teardown();
  }
}

export async function done(_options: void, id: typ.PeriodicTaskId) {
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const doneTask = impl.newPerisistDoneTask(datastore);
    await doneTask(id, now);
  } finally {
    teardown();
  }
}

export async function closePeriodicTask(
  _options: void,
  id: typ.PeriodicTaskId,
) {
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const persist = impl.newPerisistPeriodicTaskStatusChange(datastore);
    await persist(id, now, typ.PeriodicTaskStatusClose);
  } finally {
    teardown();
  }
}

export async function reopenPeriodicTask(
  _options: void,
  id: typ.PeriodicTaskId,
) {
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const persist = impl.newPerisistPeriodicTaskStatusChange(datastore);
    await persist(id, now, typ.PeriodicTaskStatusOpen);
  } finally {
    teardown();
  }
}

export async function removePeriodicTask(
  _options: void,
  id: typ.PeriodicTaskId,
) {
  const [datastore, teardown] = await setupDatastore();
  try {
    const remove = impl.newRemovePeriodicTask(datastore);
    await remove(id);
  } finally {
    teardown();
  }
}

export async function undone(_options: void, id: typ.DoneTaskId) {
  const [datastore, teardown] = await setupDatastore();
  try {
    const remove = impl.newRemoveDoneTask(datastore);
    await remove(id);
  } finally {
    teardown();
  }
}

export async function listPeriodicTasks() {
  const write = newTextWriter(Deno.stdout);
  const now = new Date();

  const [datastore, teardown] = await setupDatastore();
  try {
    const fetchTask = impl.newFetchPeriodicTask(datastore);
    const tasks = await fetchTask();
    await view.listPeriodicTasks(tasks, write, now);
  } finally {
    teardown();
  }
}

export async function listDoneTasks() {
  const write = newTextWriter(Deno.stdout);

  const [datastore, teardown] = await setupDatastore();
  try {
    const fetchDoneTask = impl.newFetchDoneTask(datastore);
    const doneTasks = await fetchDoneTask();
    await view.listDoneTasks(doneTasks, write);
  } finally {
    teardown();
  }
}
