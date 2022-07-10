CMD_NAME:=$(basename $(notdir $(abspath .)))
MAIN:=src/main.ts
IMPORT_MAP_ARGS:=--importmap import_map.json
DENO_ARGS:= ${IMPORT_MAP_ARGS} --allow-env --allow-read --allow-write ${MAIN}

INPUT_PATH:=./src/datastore/sqlite/table.sql
OUTPUT_PATH:=./src/datastore/sqlite/gen_sql.json
build:
	deno run --allow-read=${INPUT_PATH} --allow-write=${OUTPUT_PATH} ./script/build.ts ${INPUT_PATH} ${OUTPUT_PATH}

start: build
	deno run ${DENO_ARGS} task list

ARGS:=add --name=example --interval-day=15
run: build
	deno run ${DENO_ARGS} task ${ARGS}

install: build
	deno install --force --name ${CMD_NAME} ${DENO_ARGS}

IGNORE_FORMAT:=--ignore=${OUTPUT_PATH}
check:
	deno fmt ${IGNORE_FORMAT} --check
	deno check ${IMPORT_MAP_ARGS} ${MAIN}
	deno lint

fmt:
	deno fmt ${IGNORE_FORMAT}

clean:
	deno run ${DENO_ARGS} data clear
