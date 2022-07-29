import * as sqlite from "sqlite";

type QueryHook<P extends sqlite.QueryParameterSet = sqlite.QueryParameterSet> =
  (
    sql: string,
    params?: P,
  ) => void;

export class DB {
  private readonly db: sqlite.DB;
  private readonly beforeHook: QueryHook;

  constructor(
    path: string = ":memory:",
    options: sqlite.SqliteOptions = {},
    hook: QueryHook = () => {},
  ) {
    this.db = new sqlite.DB(path, options);
    this.beforeHook = hook;
  }

  query<R extends sqlite.Row = sqlite.Row>(
    sql: string,
    params?: sqlite.QueryParameterSet,
  ): Array<R> {
    this.beforeHook(sql, params);
    return this.db.query(sql, params);
  }

  queryEntries<O extends sqlite.RowObject = sqlite.RowObject>(
    sql: string,
    params?: sqlite.QueryParameterSet,
  ): Array<O> {
    this.beforeHook(sql, params);
    return this.queryEntries(sql, params);
  }

  prepareQuery<
    R extends sqlite.Row = sqlite.Row,
    O extends sqlite.RowObject = sqlite.RowObject,
    P extends sqlite.QueryParameterSet = sqlite.QueryParameterSet,
  >(
    sql: string,
  ): PreparedQuery<R, O, P> {
    return new PreparedQuery(sql, this.db.prepareQuery(sql), this.beforeHook);
  }

  execute(
    sql: string,
  ) {
    this.beforeHook(sql);
    this.db.execute(sql);
  }

  transaction<V>(closure: () => V): V {
    return this.db.transaction(closure);
  }

  close() {
    this.db.close();
  }

  get lastInsertRowId(): number {
    return this.db.lastInsertRowId;
  }
}

export class PreparedQuery<
  R extends sqlite.Row = sqlite.Row,
  O extends sqlite.RowObject = sqlite.RowObject,
  P extends sqlite.QueryParameterSet = sqlite.QueryParameterSet,
> {
  constructor(
    private readonly sql: string,
    private readonly query: sqlite.PreparedQuery<R, O, P>,
    private readonly beforeHook: QueryHook<P>,
  ) {
  }

  all(params?: P): Array<R> {
    this.beforeHook(this.sql, params);
    return this.query.all(params);
  }

  allEntries(params?: P): Array<O> {
    this.beforeHook(this.sql, params);
    return this.query.allEntries(params);
  }

  columns(): Array<sqlite.ColumnName> {
    return this.query.columns();
  }

  finalize() {
    this.query.finalize();
  }
}
