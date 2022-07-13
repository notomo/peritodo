export function asConditionPart(params: Record<string, unknown>) {
  return Object.keys(params).map((key) => {
    return `${key} = :${key}`;
  }).join(" AND ");
}
