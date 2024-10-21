import { parseArgs } from "@std/cli";
import { scanTokens } from "./scanner.ts";
import { logError } from "./errors.ts";
import { printSourceFile } from "./utils.ts";

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
    const source = {
      filename: inputFile,
      content: input,
    };

    console.log("Source code:");
    printSourceFile(source);

    const [tokens, scanErrors] = scanTokens(input);
    if (scanErrors.length > 0) {
      for (const err of scanErrors) {
        console.log();
        logError(err, source);
      }
      Deno.exit(1);
    }

    console.log();
    console.log("Tokens:");
    // console.log(tokens);
    for (const token of tokens) {
      console.log(
        `${token.type} ${token.lexeme} ${token.position} ${
          token.literal ?? null
        }`,
      );
    }
  }
}
