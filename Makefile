CMD_NAME:=$(basename $(notdir $(abspath .)))
MAIN:=src/main.ts
IMPORT_MAP_ARGS:=--importmap import_map.json
DENO_ARGS:= ${IMPORT_MAP_ARGS} --allow-env --allow-read --allow-write ${MAIN}

GENERATE_MAIN:=./script/generate_sql/main.ts
CREATE_TABLE_SQL:=./src/datastore/sqlite/table.sql
GENERATED_SQL_TS:=./src/datastore/sqlite/gen_sql.ts
$(GENERATED_SQL_TS): $(CREATE_TABLE_SQL) ./script/generate_sql/*
	deno run --allow-read --allow-write ${GENERATE_MAIN} ${CREATE_TABLE_SQL} ${GENERATED_SQL_TS}
	deno fmt ${GENERATED_SQL_TS}

build: $(GENERATED_SQL_TS)

start: build
	deno run ${DENO_ARGS} task list
	@echo "\n"
	deno run ${DENO_ARGS} done_task list

ARGS:=task add --name=example --interval-day=15
run: build
	deno run ${DENO_ARGS} ${ARGS}

install: build
	deno install --force --name ${CMD_NAME} ${DENO_ARGS}

IGNORE_FORMAT:=--ignore=${OUTPUT_PATH}
check:
	deno check ${GENERATE_MAIN}
	deno fmt ${IGNORE_FORMAT} --check
	deno check ${IMPORT_MAP_ARGS} ${MAIN}
	deno lint

fmt:
	deno fmt ${IGNORE_FORMAT}

clean:
	deno run ${DENO_ARGS} data clear

inspect:
	deno run ${DENO_ARGS} data show
