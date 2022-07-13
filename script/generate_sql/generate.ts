import {
  Project,
  SourceFile,
  VariableDeclarationKind,
  WriterFunction,
  Writers,
} from "https://deno.land/x/ts_morph@15.1.0/mod.ts";
import { Column, Table } from "./parse.ts";

export function generate(path: string, tables: Table[], sql: string) {
  const project = new Project();
  const source = project.createSourceFile(path, undefined, {
    overwrite: true,
  });
  generateForAll(source, tables, sql);
  for (const table of tables) {
    generateOne(source, table);
  }
  source.save();
}

function generateForAll(source: SourceFile, tables: Table[], sql: string) {
  source.addImportDeclaration({
    namedImports: ["DB"],
    moduleSpecifier: "sqlite",
  });

  source.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: "createTable",
      initializer: (writer) => {
        writer.writeLine(`\`${sql}\``);
      },
    }],
  });

  const tableNames = new Map<string, WriterFunction>();
  for (const table of tables) {
    tableNames.set(table.name, (writer) => {
      writer.write(`"${table.name}"`);
    });
  }
  source.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [{
      name: "tables",
      initializer: Writers.object(Object.fromEntries(tableNames)),
    }],
  });
}

function capitalize(tableName: string): string {
  return tableName[0].toUpperCase() + tableName.slice(1);
}

function generateOne(source: SourceFile, table: Table) {
  const columnsExceptAutoIncrement = table.columns.filter((column) => {
    return !column.isAutoIncrement;
  });
  const typeObject = new Map<string, WriterFunction>();
  for (const column of columnsExceptAutoIncrement) {
    typeObject.set(column.name, (writer) => {
      writer.write(column.type);
    });
  }
  source.addStatements((writer) => {
    writer.newLine().writeLine(`// table name: ${table.name}`);
  });
  const capitalized = capitalize(table.name);
  const insertParamsName = `Insert${capitalized}Params`;
  source.addTypeAlias({
    isExported: true,
    name: insertParamsName,
    type: Writers.object(Object.fromEntries(typeObject)),
  });

  const insert = insertQuery(table, columnsExceptAutoIncrement);
  source.addFunction({
    isExported: true,
    name: `insert${capitalized}`,
    parameters: [
      { name: "db", type: "DB" },
      { name: "params", type: insertParamsName },
    ],
    statements: (writer) => {
      writer.writeLine(`db.query(\`${insert}\`, params)`);
    },
  });
}

function insertQuery(table: Table, columns: Column[]) {
  const indent = "  ";
  const intoColumns = columns.map((column) => {
    return column.name;
  }).join(`\n${indent},`);
  const valuesColumns = columns.map((column) => {
    return `:${column.name}`;
  }).join(`\n${indent},`);
  const query = `
INSERT INTO ${table.name} (
${indent}${intoColumns}
) VALUES (
${indent}${valuesColumns}
)`;
  return query;
}
