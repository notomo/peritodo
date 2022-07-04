import { writeAll } from "streams/conversion";

export function newTextWriter(
  writer: Deno.Writer,
): (output: string) => Promise<void> {
  return (output: string) => {
    const text = new TextEncoder().encode(output);
    return writeAll(writer, text);
  };
}
