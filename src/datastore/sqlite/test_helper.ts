import { DB, setupDatastore } from "/datastore/sqlite/mod.ts";

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
