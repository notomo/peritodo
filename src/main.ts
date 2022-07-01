import { Command } from "cliffy/command";
import { addTask, listTasks, newFetchTask, newPersistTask } from "./app/mod.ts";
import { clearDatastore, setupDatastore } from "./datastore/sqlite/mod.ts";
import { writeAll } from "streams/conversion";

async function main() {
  await new Command()
    .name("peritodo")
    .version("0.0.0")
    .command(
      "task",
      new Command()
        .command("add")
        .option("--name=<name>", "task name", { required: true })
        .option("--interval-day=<intervalDay:number>", "interval day", {
          required: true,
        })
        .action(async (options) => {
          const [datastore, teardown] = await setupDatastore();
          try {
            const persistTask = newPersistTask(datastore);
            await addTask(persistTask, options["name"], options["intervalDay"]);
          } finally {
            teardown();
          }
        })
        .command("list")
        .action(async () => {
          const [datastore, teardown] = await setupDatastore();
          try {
            const fetchTask = newFetchTask(datastore);
            const write = (output: string): Promise<void> => {
              const text = new TextEncoder().encode(output);
              return writeAll(Deno.stdout, text);
            };
            const now = new Date();
            await listTasks(fetchTask, write, now);
          } finally {
            teardown();
          }
        }),
    )
    .command(
      "data",
      new Command().command("clear").action(async () => {
        await clearDatastore();
      }),
    )
    .parse(Deno.args);
}

await main();
