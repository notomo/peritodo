import { assertObjectMatch } from "testing/asserts";
import { withDB } from "/datastore/sqlite/test_helper.ts";
import * as impl from "./impl_sqlite.ts";

Deno.test("fetchPeriodicTasks", async (t) => {
  await t.step(
    "can fetch a new periodicTask",
    withDB(async (db) => {
      const want = await impl.persistPeriodicTask(db, {
        name: "name",
        startAt: new Date(),
        intervalDay: 1,
      });

      const got = await impl.fetchPeriodicTasks(db);

      assertObjectMatch(got[0], want);
    }),
  );
});

Deno.test("replacePeriodicTasks", async (t) => {
  await t.step(
    "can update a periodicTask",
    withDB(async (db) => {
      const task = await impl.persistPeriodicTask(db, {
        name: "name",
        startAt: new Date(),
        intervalDay: 1,
      });

      await impl.replacePeriodicTasks(
        db,
        [{
          id: task.id,
          name: "updated",
          intervalDay: 2,
        }],
        [task],
      );

      const got = await impl.fetchPeriodicTasks(db);
      assertObjectMatch(got[0], {
        id: task.id,
        name: "updated",
        intervalDay: 2,
        startAt: task.startAt,
      });
    }),
  );
});
