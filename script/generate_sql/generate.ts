import {
  Project,
  StatementStructures,
  StructureKind,
  VariableDeclarationKind,
  WriterFunction,
  Writers,
} from "https://deno.land/x/ts_morph@15.1.0/mod.ts";
import {
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
      namedImports: ["asConditionPart", "asIntoValues", "asIntoAndValues"],
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

const columnTypes: { [K in ColumnTypeAffinity]: string } = {
  INTEGER: "number",
  REAL: "number",
  NUMERIC: "number",
  TEXT: "string",
  BLOB: "Uint8Array",
};

function generateOne(table: Table): StatementStructures[] {
  const columnsExceptAutoIncrement = table.columns.filter((column) => {
    return !column.isAutoIncrement;
  });
  const insertObject = new Map<string, WriterFunction>();
  for (const column of columnsExceptAutoIncrement) {
    insertObject.set(column.name, (writer) => {
      writer.write(columnTypes[column.typeAffinity]);
    });
  }
  const capitalized = capitalize(table.name);
  const insertParamsName = `Insert${capitalized}Params`;

  const replaceParamsName = `Replace${capitalized}Params`;
  const replaceObject = new Map<string, WriterFunction>();
  for (const column of table.columns) {
    const name = column.isPrimaryKey ? column.name : optionalType(column.name);
    replaceObject.set(name, (writer) => {
      writer.write(columnTypes[column.typeAffinity]);
    });
  }
  const columnsVariableName = `${table.name}Columns`;

  const deleteObject = new Map<string, WriterFunction>();
  for (const column of table.columns) {
    deleteObject.set(column.name, (writer) => {
      writer.write(columnTypes[column.typeAffinity]);
    });
  }
  const deleteParamsName = `Delete${capitalized}Params`;

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
        { name: "...paramsList", type: `${insertParamsName}[]` },
      ],
      statements: (writer) => {
        writer.writeLine(
          `const [values, params] = asIntoValues(paramsList, ${columnsVariableName})`,
        );
        const intoColumns = columnsExceptAutoIncrement.map((column) => {
          return column.name;
        }).join(`, `);
        writer.writeLine(
          `const query = \`INSERT INTO ${table.name} (${intoColumns}) VALUES \${values}\``,
        );
        writer.writeLine(`db.query(query, params)`);
      },
    },
    {
      kind: StructureKind.TypeAlias,
      isExported: true,
      name: replaceParamsName,
      type: typeParamed(
        "Readonly",
        Writers.object(Object.fromEntries(replaceObject)),
      ),
      leadingTrivia: "\n",
    },
    {
      kind: StructureKind.Function,
      isExported: true,
      name: `replace${capitalized}`,
      parameters: [
        { name: "db", type: "DB" },
        { name: "...paramsList", type: `${replaceParamsName}[]` },
      ],
      statements: (writer) => {
        writer.writeLine(
          `const [columns, values, params] = asIntoAndValues(paramsList, ${columnsVariableName})`,
        );
        writer.writeLine(
          `const query = \`REPLACE INTO ${table.name} \${columns} VALUES \${values}\``,
        );
        writer.writeLine(`db.query(query, params)`);
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
