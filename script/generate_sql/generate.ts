import {
  Project,
  StatementStructures,
  StructureKind,
  VariableDeclarationKind,
  WriterFunction,
  Writers,
} from "https://deno.land/x/ts_morph@15.1.0/mod.ts";
import {
  Column,
  ColumnTypeAffinity,
  Table,
} from "https://deno.land/x/sqlite_schema@0.0.2/mod.ts";

export async function generate(path: string, tables: Table[], sql: string) {
  const project = new Project();
  await project.createSourceFile(path, undefined, {
    overwrite: true,
  })
    .set({
      kind: StructureKind.SourceFile,
      statements: [
        ...generateForAll(tables, sql),
        ...tables.flatMap((table) => generateOne(table)),
      ],
    })
    .save();
}

function generateForAll(
  tables: Table[],
  sql: string,
): StatementStructures[] {
  return [
    {
      kind: StructureKind.ImportDeclaration,
      namedImports: ["DB"],
      moduleSpecifier: "./db.ts",
    },
    {
      kind: StructureKind.ImportDeclaration,
      namedImports: ["asConditionPart", "asIntoValues"],
      moduleSpecifier: "./builder.ts",
    },
    {
      kind: StructureKind.VariableStatement,
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: "createTable",
        initializer: (writer) => {
          writer.writeLine(`\`${sql}\``);
        },
      }],
      leadingTrivia: "\n",
      trailingTrivia: "\n",
    },
    {
      kind: StructureKind.VariableStatement,
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: "tables",
        initializer: (writer) => {
          objectWriter((table) => [table.name, `"${table.name}"`], tables)(
            writer,
          );
          writer.write(" as const");
        },
      }],
      leadingTrivia: "\n",
      trailingTrivia: "\n",
    },
    {
      kind: StructureKind.VariableStatement,
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: "columns",
        initializer: (writer) => {
          objectWriter((table) => {
            return [
              table.name,
              objectWriter(
                (column) => [column.name, `"${table.name}.${column.name}"`],
                table.columns,
              ),
            ];
          }, tables)(writer);
          writer.write(" as const");
        },
      }],
      leadingTrivia: "\n",
      trailingTrivia: "\n",
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: "AllColumns",
      type: (writer) => {
        const allColumnNames = tables
          .flatMap((table) => {
            return table.columns.map((column) =>
              `"${table.name}.${column.name}"`
            );
          })
          .join(" | ");
        writer.write(allColumnNames);
      },
      leadingTrivia: "\n",
      trailingTrivia: "\n",
    },
  ];
}

function generateOne(table: Table): StatementStructures[] {
  const capitalized = capitalize(table.name);
  const columnsVariableName = `${table.name}Columns`;
  return [
    {
      kind: StructureKind.VariableStatement,
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: columnsVariableName,
        initializer: (writer) => {
          const names = table.columns.map((e) => `"${e.name}"`).join(", ");
          writer.write(`[${names}]`);
        },
      }],
      leadingTrivia: "\n",
    },
    ...generateInsert(table, capitalized, columnsVariableName),
    ...generateReplace(table, capitalized, columnsVariableName),
    ...generateDelete(table, capitalized),
  ];
}

const dbParam = { name: "db", type: "DB" };

function generateInsert(
  table: Table,
  capitalized: string,
  columnsVariableName: string,
): StatementStructures[] {
  const columns = table.columns.filter((column) => {
    return !column.isAutoIncrement;
  });
  const paramsName = `Insert${capitalized}Params`;
  return [
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: paramsName,
      type: typeParamed(
        "Readonly",
        paramsWriter(
          (column) => column.name,
          columns,
        ),
      ),
      leadingTrivia: "\n",
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `insert${capitalized}`,
      parameters: [
        dbParam,
        { name: "...paramsList", type: `${paramsName}[]` },
      ],
      statements: (writer) => {
        writer.writeLine(
          `const [values, params] = asIntoValues(paramsList, ${columnsVariableName})`,
        );
        const intoColumns = columns.map((column) => {
          return column.name;
        }).join(`, `);
        writer.writeLine(
          `const query = \`INSERT INTO ${table.name} (${intoColumns}) VALUES \${values}\``,
        );
        writer.writeLine(`db.query(query, params)`);
      },
    },
  ];
}

function generateReplace(
  table: Table,
  capitalized: string,
  columnsVariableName: string,
): StatementStructures[] {
  const columns = table.columns;
  const paramsName = `Replace${capitalized}Params`;
  return [
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: paramsName,
      type: typeParamed(
        "Readonly",
        paramsWriter(
          (column) => column.name,
          columns,
        ),
      ),
      leadingTrivia: "\n",
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `replace${capitalized}`,
      parameters: [
        dbParam,
        { name: "...paramsList", type: `${paramsName}[]` },
      ],
      statements: (writer) => {
        writer.writeLine(
          `const [values, params] = asIntoValues(paramsList, ${columnsVariableName})`,
        );
        const intoColumns = columns.map((column) => {
          return column.name;
        }).join(`, `);
        writer.writeLine(
          `const query = \`REPLACE INTO ${table.name} (${intoColumns}) VALUES \${values}\``,
        );
        writer.writeLine(`db.query(query, params)`);
      },
    },
  ];
}

function generateDelete(
  table: Table,
  capitalized: string,
): StatementStructures[] {
  const columns = table.columns;
  const paramsName = `Delete${capitalized}Params`;
  return [
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: paramsName,
      type: typeParamed(
        "Partial",
        typeParamed(
          "Readonly",
          paramsWriter(
            (column) => column.name,
            columns,
          ),
        ),
      ),
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `delete${capitalized}`,
      parameters: [
        dbParam,
        { name: "params", type: paramsName },
      ],
      statements: (writer) => {
        writer.writeLine(`const condition = asConditionPart(params)`);
        writer.writeLine(
          `const query = \`DELETE FROM ${table.name} WHERE \${condition}\`;`,
        );
        writer.writeLine(`db.query(query, params)`);
      },
    },
  ];
}

function capitalize(tableName: string): string {
  return tableName[0].toUpperCase() + tableName.slice(1);
}

function typeParamed(
  name: string,
  param: WriterFunction,
): WriterFunction {
  return (writer) => {
    writer.write(`${name}<`);
    param(writer);
    writer.write(">");
  };
}

const columnTypes: { [K in ColumnTypeAffinity]: string } = {
  INTEGER: "number",
  REAL: "number",
  NUMERIC: "number",
  TEXT: "string",
  BLOB: "Uint8Array",
};

function paramsWriter(
  toParamKey: (column: Column) => string,
  columns: Column[],
): WriterFunction {
  return objectWriter((column) => {
    return [toParamKey(column), columnTypes[column.typeAffinity]];
  }, columns);
}

function objectWriter<T>(
  toParamKeyValue: (e: T) => [string, string | WriterFunction],
  elements: T[],
): WriterFunction {
  const map = new Map<string, WriterFunction>();
  for (const e of elements) {
    const [key, value] = toParamKeyValue(e);
    if (typeof value === "string") {
      map.set(key, (writer) => {
        writer.write(value);
      });
    } else {
      map.set(key, value);
    }
  }
  return Writers.object(Object.fromEntries(map));
}
