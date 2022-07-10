import { Command } from "cliffy/command";
import * as taskActions from "./app/task/mod.ts";
import * as dataActions from "./app/data/mod.ts";

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
        .action(taskActions.list)
        .command("remove")
        .arguments("<id:number>")
        .action(taskActions.remove),
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
