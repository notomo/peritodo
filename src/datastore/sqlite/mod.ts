import { join } from "path";
import { ensureDir } from "fs";
import xdg from "xdg";
import { DB } from "sqlite";
import * as sql from "./gen_sql.ts";
export * as sql from "./gen_sql.ts";
export { alias } from "./select.ts";

type Teardown = () => void;

function getDataDir(): string {
  return join(xdg.data(), "peritodo");
}

type Mode = "file" | "memory";

const setup = {
  ["file"]: async (): Promise<DB> => {
    const dataDir = getDataDir();
    await ensureDir(dataDir);

    const dataPath = join(dataDir, "data.db");
    return new DB(dataPath);
  },
  ["memory"]: (): Promise<DB> => {
    const db = new DB();
    return Promise.resolve(db);
  },
};

export async function setupDatastore(
  mode: Mode = "file",
): Promise<[DB, Teardown]> {
  const db = await setup[mode]();
  const teardown = () => {
    db.close();
  };

  try {
    db.execute(sql.createTable);
  } catch (error) {
    teardown();
    throw error;
  }

  return [db, teardown];
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
