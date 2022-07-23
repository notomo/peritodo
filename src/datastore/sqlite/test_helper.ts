import { setupDatastore } from "/datastore/sqlite/mod.ts";
import { DB } from "sqlite";

type Test = (db: DB) => Promise<void>;

export function withDB(test: Test): () => Promise<void> {
  return async () => {
    const [db, teardown] = await setupDatastore("memory");
    try {
      await test(db);
    } finally {
      teardown();
    }
  };
}
