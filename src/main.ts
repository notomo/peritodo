import { Command } from "cliffy/command";
import * as taskActions from "./action/task/mod.ts";
import * as dataActions from "./action/data/mod.ts";

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
        .action(taskActions.add)
        .command("list")
        .action(taskActions.listPeriodicTasks)
        .command("done")
        .arguments("<id:number>")
        .action(taskActions.done)
        .command("remove")
        .arguments("<id:number>")
        .action(taskActions.remove),
    )
    .command(
      "done_task",
      new Command()
        .command("list")
        .action(taskActions.listDoneTasks),
    )
    .command(
      "data",
      new Command()
        .command("clear")
        .action(dataActions.clear),
    )
    .parse(Deno.args);
}

await main();
