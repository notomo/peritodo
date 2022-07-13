import { join } from "path";
import { ensureDir } from "fs";
import xdg from "xdg";
import { DB } from "sqlite";
import * as sql from "./gen_sql.ts";
export * as sql from "./gen_sql.ts";

type Teardown = () => void;

function getDataDir(): string {
  return join(xdg.data(), "peritodo");
}

export async function setupDatastore(): Promise<[DB, Teardown]> {
  const dataDir = getDataDir();
  await ensureDir(dataDir);

  const dataPath = join(dataDir, "data.db");
  const db = new DB(dataPath);

  db.execute(sql.createTable);

  return [
    db,
    () => {
      db.close();
    },
  ];
}

export async function clearDatastore(): Promise<void> {
  const dataDir = getDataDir();
  try {
    await Deno.remove(dataDir, { recursive: true });
  } catch (error) {
    if (error && error.name === "NotFound") {
      return;
    }
    throw error;
  }
}
