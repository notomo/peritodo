CREATE TABLE IF NOT EXISTS periodicTask (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(name != ''),
  startAt TEXT NOT NULL,
  intervalDay INTEGER CHECK(intervalDay > 0)
) STRICT;

CREATE TABLE IF NOT EXISTS periodicTaskStatus (
  name TEXT NOT NULL PRIMARY KEY
) STRICT;
INSERT OR IGNORE INTO periodicTaskStatus (name) VALUES ('open');
INSERT OR IGNORE INTO periodicTaskStatus (name) VALUES ('close');

CREATE TABLE IF NOT EXISTS periodicTaskStatusChange (
  periodicTaskId INTEGER NOT NULL,
  changedAt TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE,
  FOREIGN KEY (status) REFERENCES periodicTaskStatus(name) ON UPDATE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS periodicTaskStatusChange_periodicTaskId ON periodicTaskStatusChange(periodicTaskId);

DROP TRIGGER IF EXISTS periodicTaskStatusChange_checkStatus;
CREATE TRIGGER IF NOT EXISTS periodicTaskStatusChange_checkStatus
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
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  periodicTaskId INTEGER NOT NULL,
  doneAt TEXT NOT NULL,
  FOREIGN KEY (periodicTaskId) REFERENCES periodicTask(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS doneTask_periodicTaskId ON doneTask(periodicTaskId);
