import { nextDate } from "./type.ts";
import { assertEquals } from "https://deno.land/std@0.149.0/testing/asserts.ts";

Deno.test("nextDate", async (t) => {
  const cases = [
    {
      name: "initial state",
      task: {
        startAt: "2022-01-01T00:00:00.000Z",
        recentDoneAt: undefined,
        intervalDay: 7,
      },
      now: "2022-01-03T00:00:00.000Z",
      want: "2022-01-08T00:00:00.000Z",
    },
    {
      name: "has recentDoneAt",
      task: {
        startAt: "2022-01-01T00:00:00.000Z",
        recentDoneAt: "2022-01-03T00:00:00.000Z",
        intervalDay: 7,
      },
      now: "2022-01-04T00:00:00.000Z",
      want: "2022-01-15T00:00:00.000Z",
    },
    {
      name: "looped twice",
      task: {
        startAt: "2022-01-01T00:00:00.000Z",
        recentDoneAt: undefined,
        intervalDay: 7,
      },
      now: "2022-01-16T00:00:00.000Z",
      want: "2022-01-22T00:00:00.000Z",
    },
  ];
  for (const e of cases) {
    const task = JSON.stringify(e.task);
    const name = `${e.name}: ${t.name}(${task}, ${e.now}) => ${e.want}`;
    await t.step(name, () => {
      const periodicTask = {
        id: 1,
        name: "",
        startAt: new Date(e.task.startAt),
        recentDoneAt: e.task.recentDoneAt
          ? new Date(e.task.recentDoneAt)
          : undefined,
        intervalDay: e.task.intervalDay,
      };

      const got = nextDate(periodicTask, new Date(e.now));

      assertEquals(got, new Date(e.want));
    });
  }
});
