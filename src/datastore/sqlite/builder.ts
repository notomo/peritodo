export function asConditionPart(params: Record<string, unknown>) {
  return Object.keys(params).map((key) => {
    return `${key} = :${key}`;
  }).join(" AND ");
}

type RecordValue = string | number;

export function asIntoValues<T = Record<string, RecordValue>>(
  paramsList: T[],
  allColumns: string[],
): [string, Record<string, RecordValue>] {
  let i = 0;
  const allValues = [];
  let allParams = {};
  for (const params of paramsList) {
    const [values, indexedParams] = asOneIntoValues(params, allColumns, i);
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
  allColumns: string[],
  index: number,
): [string, Record<string, RecordValue>] {
  const indexedParams: Record<string, RecordValue> = {};
  for (const [key, value] of Object.entries(params)) {
    indexedParams[`${index}_${key}`] = value;
  }
  const keys = Object.keys(params);
  const values = allColumns
    .filter((e) => {
      return keys.includes(e);
    })
    .map((e) => {
      return `:${index}_${e}`;
    })
    .join(", ");

  return [
    `(${values})`,
    indexedParams,
  ];
}
