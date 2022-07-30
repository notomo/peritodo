import {
  Project,
  StatementStructures,
  StructureKind,
  VariableDeclarationKind,
  WriterFunction,
  Writers,
} from "https://deno.land/x/ts_morph@15.1.0/mod.ts";
import { Column, Table } from "./extract.ts";

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
      namedImports: ["asConditionPart"],
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
  const columnsExceptAutoIncrement = table.columns.filter((column) => {
    return !column.isAutoIncrement;
  });
  const insertObject = new Map<string, WriterFunction>();
  for (const column of columnsExceptAutoIncrement) {
    insertObject.set(column.name, (writer) => {
      writer.write(column.type);
    });
  }
  const capitalized = capitalize(table.name);
  const insertParamsName = `Insert${capitalized}Params`;
  const insert = insertQuery(table, columnsExceptAutoIncrement);

  const deleteObject = new Map<string, WriterFunction>();
  for (const column of table.columns) {
    deleteObject.set(column.name, (writer) => {
      writer.write(column.type);
    });
  }
  const deleteParamsName = `Delete${capitalized}Params`;

  return [
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: insertParamsName,
      type: typeParamed(
        "Readonly",
        Writers.object(Object.fromEntries(insertObject)),
      ),
      leadingTrivia: "\n",
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `insert${capitalized}`,
      parameters: [
        { name: "db", type: "DB" },
        { name: "params", type: insertParamsName },
      ],
      statements: (writer) => {
        writer.writeLine(`db.query(\`${insert}\`, params)`);
      },
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: deleteParamsName,
      type: typeParamed(
        "Partial",
        typeParamed(
          "Readonly",
          Writers.object(Object.fromEntries(deleteObject)),
        ),
      ),
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `delete${capitalized}`,
      parameters: [
        { name: "db", type: "DB" },
        { name: "params", type: deleteParamsName },
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

function insertQuery(table: Table, columns: Column[]) {
  const indent = "  ";
  const intoColumns = columns.map((column) => {
    return column.name;
  }).join(`\n${indent},`);
  const valuesColumns = columns.map((column) => {
    return `:${column.name}`;
  }).join(`\n${indent},`);
  const query = `INSERT INTO ${table.name} (
${indent}${intoColumns}
) VALUES (
${indent}${valuesColumns}
)`;
  return query;
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
