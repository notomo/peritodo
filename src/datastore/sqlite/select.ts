import { AllColumns } from "./gen_sql.ts";
export function alias(
  aliasTableName: string,
  fullColumnName: AllColumns,
): string {
  const columnName = fullColumnName.toString().split(".")[1];
  return `${aliasTableName}.${columnName}`;
}
