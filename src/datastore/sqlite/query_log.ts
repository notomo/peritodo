import { logger } from "/lib/logger.ts";
import { QueryParameterSet } from "./db.ts";

export function loggerFunction(sql: string, params?: QueryParameterSet) {
  if (sql.match("CREATE TABLE")) {
    return;
  }
  const params_msg = params ? `\n${JSON.stringify(params)}` : "";
  const msg = `\n${sql}${params_msg}`;
  logger.debug(msg);
}
