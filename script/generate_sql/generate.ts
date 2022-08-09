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

export function generate(path: string, tables: Table[], sql: string) {
  const project = new Project();
  const source = project.createSourceFile(path, undefined, {
    overwrite: true,
  });

  const statements = generateForAll(tables, sql);
  for (const table of tables) {
    statements.push(...generateOne(table));
  }
  source.set({
    kind: StructureKind.SourceFile,
    statements: statements,
  });

  source.save();
}

function generateForAll(
  tables: Table[],
  sql: string,
): StatementStructures[] {
  const tableNames = new Map<string, WriterFunction>();
  const fullColumnNames = new Map<string, WriterFunction>();
  const allColumnNames: string[] = [];
  for (const table of tables) {
    tableNames.set(table.name, (writer) => {
      writer.write(`"${table.name}"`);
    });
    const columnNames = new Map<string, WriterFunction>();
    for (const column of table.columns) {
      const fullName = `"${table.name}.${column.name}"`;
      columnNames.set(column.name, (writer) => {
        writer.write(fullName);
      });
      allColumnNames.push(fullName);
    }
    fullColumnNames.set(
      table.name,
      Writers.object(Object.fromEntries(columnNames)),
    );
  }

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
          Writers.object(Object.fromEntries(tableNames))(writer);
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
          Writers.object(Object.fromEntries(fullColumnNames))(writer);
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
        writer.write(allColumnNames.join(" | "));
      },
      leadingTrivia: "\n",
      trailingTrivia: "\n",
    },
  ];
}

function capitalize(tableName: string): string {
  return tableName[0].toUpperCase() + tableName.slice(1);
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
        { name: "db", type: "DB" },
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
          (column) =>
            column.isPrimaryKey ? column.name : optionalType(column.name),
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
        { name: "db", type: "DB" },
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
            table.columns,
          ),
        ),
      ),
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `delete${capitalized}`,
      parameters: [
        { name: "db", type: "DB" },
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

function optionalType(
  name: string,
): string {
  return `${name}?`;
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
  const map = new Map<string, WriterFunction>();
  for (const column of columns) {
    const key = toParamKey(column);
    map.set(key, (writer) => {
      writer.write(columnTypes[column.typeAffinity]);
    });
  }
  return Writers.object(Object.fromEntries(map));
}
