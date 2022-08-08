export async function edit(
  input: Uint8Array = new Uint8Array(),
): Promise<string | undefined> {
  const path = await Deno.makeTempFile({ prefix: "peritodo_" });
  await Deno.writeFile(path, input);

  const editorCommand = getEditorCommand();
  const cmd = [...editorCommand.split(" "), path];
  const process = Deno.run({
    cmd: cmd,
  });
  const status = await process.status();
  process.close();
  if (!status.success) {
    return undefined;
  }
  const rawOutput = await Deno.readFile(path);
  return new TextDecoder().decode(rawOutput);
}

function getEditorCommand(): string {
  const peritodoEditor = Deno.env.get("PERITODO_EDITOR");
  if (peritodoEditor) {
    return peritodoEditor;
  }
  const editor = Deno.env.get("EDITOR");
  if (editor) {
    return editor;
  }
  throw new Error("no environment variable: PERITODO_EDITOR or EDITOR");
}
