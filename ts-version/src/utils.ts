// deno-lint-ignore no-explicit-any
export type Push<T extends any[], V> = [...T, V];
// deno-lint-ignore no-explicit-any
export type Pop<T extends any[]> = T extends [...infer U, any] ? U : never;

export type SourceFile = {
  filename: string;
  content: string;
};

export function printSourceFile(source: SourceFile): void {
  const lines = source.content.split("\n");
  const total = lines.length;
  const pad = total.toString().length;

  console.log(`${"".padStart(pad)}┌─ ${source.filename}`);
  console.log(`${"".padStart(pad)}|`);
  for (let i = 0; i < total; i++) {
    console.log(`${(i + 1).toString().padStart(pad)}| ${lines[i]}`);
  }
}
