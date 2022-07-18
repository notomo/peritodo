CREATE TABLE IF NOT EXISTS periodicTask (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(name != ''),
  startAt TEXT NOT NULL,
  intervalDay INTEGER CHECK(intervalDay > 0)
);

CREATE TABLE IF NOT EXISTS periodicTaskStatusChange (
  periodicTaskId INTEGER NOT NULL,
  changedAt TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open', 'close')),
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS checkPeriodicTaskStatusChange;
CREATE TRIGGER IF NOT EXISTS checkPeriodicTaskStatusChange
BEFORE INSERT ON periodicTaskStatusChange
BEGIN
  SELECT RAISE(FAIL, 'status is already changed')
  FROM periodicTaskStatusChange
  WHERE
    periodicTaskStatusChange.periodicTaskId = NEW.periodicTaskId
    AND periodicTaskStatusChange.status = NEW.status
    AND NOT EXISTS (
      SELECT 1
      FROM periodicTaskStatusChange another
      WHERE
        periodicTaskStatusChange.periodicTaskId = NEW.periodicTaskId
        AND another.periodicTaskId = NEW.periodicTaskId
        AND another.changedAt > periodicTaskStatusChange.changedAt
    );
END;

CREATE TABLE IF NOT EXISTS doneTask (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodicTaskId INTEGER NOT NULL,
  doneAt TEXT NOT NULL,
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
);
