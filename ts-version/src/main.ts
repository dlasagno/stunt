import { parseArgs } from "@std/cli";
import { logError } from "./errors.ts";
import { parse } from "./parser.ts";
import { scanTokens } from "./scanner.ts";
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
    for (const token of tokens) {
      console.log(
        `${token.type.padEnd(13)}\t${
          token.lexeme.padEnd(10)
        }\t${token.position}\t${token.literal ?? null}`,
      );
    }

    const [ast, parseErrors] = parse(tokens);
    if (parseErrors.length > 0) {
      for (const err of parseErrors) {
        console.log();
        logError(err, source);
      }
      Deno.exit(1);
    }

    console.log();
    console.log("AST:");
    console.log(ast);
  }
}
