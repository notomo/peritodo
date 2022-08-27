import { Command, EnumType } from "cliffy/command";
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
        .action(taskActions.addPeriodicTask)
        .command("list")
        .type("outputter-type", new EnumType(["table", "json"]))
        .option("--outputter=<outputter:outputter-type>", "outputter type", {
          default: "table" as const,
        })
        .action(taskActions.listPeriodicTasks)
        .command("done")
        .arguments("<id:number>")
        .action(taskActions.done)
        .command("close")
        .arguments("<id:number>")
        .action(taskActions.closePeriodicTask)
        .command("reopen")
        .arguments("<id:number>")
        .action(taskActions.reopenPeriodicTask)
        .command("remove")
        .arguments("<id:number>")
        .action(taskActions.removePeriodicTask)
        .command("edit")
        .action(taskActions.editPeriodicTasks),
    )
    .command(
      "done_task",
      new Command()
        .command("list")
        .type("outputter-type", new EnumType(["table", "json"]))
        .option("--outputter=<outputter:outputter-type>", "outputter type", {
          default: "table" as const,
        })
        .action(taskActions.listDoneTasks)
        .command("undone")
        .arguments("<id:number>")
        .action(taskActions.undone),
    )
    .command(
      "data",
      new Command()
        .command("show")
        .action(dataActions.show)
        .command("clear")
        .action(dataActions.clear),
    )
    .parse(Deno.args);
}

await main();
