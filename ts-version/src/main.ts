import { parseArgs } from "@std/cli";
import { scanTokens } from "./scanner.ts";

export function add(a: number, b: number): number {
  return a + b;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  // console.log("Add 2 + 3 =", add(2, 3));
  const args = parseArgs(Deno.args);

  const [command, inputFile, outputFile] = args._;

  if (command === "tokenize" && typeof inputFile === "string") {
    const input = await Deno.readTextFile(inputFile);
    console.log(input);
    const [tokens, errors] = scanTokens(input);

    console.log(tokens);
  }
}
