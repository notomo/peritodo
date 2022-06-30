import { join } from "path";
import { ensureDir } from "fs";
import xdg from "xdg";
import { DB } from "sqlite";
import sql from "./gen_sql.json" assert { type: "json" };

type Teardown = () => void;

export async function setupDatastore(): Promise<[DB, Teardown]> {
  const dataDir = join(xdg.data(), "peritodo");
  await ensureDir(dataDir);

  const dataPath = join(dataDir, "data.db");
  const db = new DB(dataPath);

  db.query(sql.createTable);

  return [
    db,
    () => {
      db.close();
    },
  ];
}
