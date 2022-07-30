import * as log from "log";

const levelNameWidth = "critical".length;

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: (r) => {
        const local = new Date(
          r.datetime.getTime() - r.datetime.getTimezoneOffset() * 60 * 1000,
        );
        const datetime = local.toISOString();
        const levelName = r.levelName.padEnd(levelNameWidth);
        return `[${datetime} ${levelName}] ${r.msg}`;
      },
    }),
  },

  loggers: {
    default: {
      level: Deno.env.get("PERITODO_DEBUG") ? "DEBUG" : "INFO",
      handlers: ["console"],
    },
  },
});

export const logger = log.getLogger();
