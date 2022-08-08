export function asConditionPart(params: Record<string, unknown>) {
  return Object.keys(params).map((key) => {
    return `${key} = :${key}`;
  }).join(" AND ");
}

type RecordValue = string | number;

export function asIntoValues<T = Record<string, RecordValue>>(
  paramsList: T[],
): [string, Record<string, RecordValue>] {
  let i = 0;
  const allValues = [];
  let allParams = {};
  for (const params of paramsList) {
    const [values, indexedParams] = asOneIntoValues(params, i);
    allValues.push(values);
    allParams = { ...allParams, ...indexedParams };
    i++;
  }
  return [
    allValues.join(", "),
    allParams,
  ];
}

function asOneIntoValues<T = Record<string, RecordValue>>(
  params: T,
  index: number,
): [string, Record<string, RecordValue>] {
  const keys = [];
  const indexedParams: Record<string, RecordValue> = {};
  for (const [key, value] of Object.entries(params)) {
    const indexedKey = `${index}_${key}`;
    keys.push(indexedKey);
    indexedParams[indexedKey] = value;
  }
  const values = keys.map((key) => `:${key}`).join(", ");
  return [
    `(${values})`,
    indexedParams,
  ];
}
