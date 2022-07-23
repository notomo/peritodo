import { assertObjectMatch } from "testing/asserts";
import { withDB } from "/datastore/sqlite/test_helper.ts";
import * as impl from "./impl_sqlite.ts";

Deno.test("fetchPeriodicTasks", async (t) => {
  await t.step(
    "can fetch a new periodicTask",
    withDB(async (db) => {
      const param = {
        name: "name",
        startAt: new Date(),
        intervalDay: 1,
      };
      await impl.persistPeriodicTask(db, param);

      const got = await impl.fetchPeriodicTasks(db);

      const want = {
        id: 1,
        name: param.name,
        startAt: param.startAt,
        intervalDay: param.intervalDay,
      };
      assertObjectMatch(got[0], want);
    }),
  );
});
