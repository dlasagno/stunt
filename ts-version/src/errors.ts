import type { SourceFile } from "./utils.ts";

export type CompilerError = {
  position: number;
  length: number;
  code: ErrorCode;
  message: string;
};
export type ErrorCode = keyof typeof errors;

export function logError(err: CompilerError, source: SourceFile): void {
  const details = getErrorDetails(err, source.content);
  const pad = details.lineNumber.toString().length;

  console.error(
    `%cError: ${errors[err.code]}`,
    "color: red",
  );
  console.error(
    `${
      "".padStart(pad)
    }┌─ ${source.filename}:${details.lineNumber}:${details.column}`,
  );
  console.error(`${"".padStart(pad)}| `);
  console.error(
    `${details.lineNumber}| ${details.line.slice(0, details.column - 1)}%c${
      details.line.slice(
        details.column - 1,
        details.column + err.length - 1,
      )
    }%c${details.line.slice(details.column + err.length - 1)}`,
    "color: red",
    "",
  );
  console.error(
    `${"".padStart(pad)}| ${"".padStart(details.column - 1)}%c${
      "^".padStart(err.length, "^")
    } ${err.message}`,
    "color: red",
  );
}

function getErrorDetails(err: CompilerError, source: string): {
  lineNumber: number;
  column: number;
  line: string;
} {
  let lineNumber = 1;
  let lineStart = 0;
  for (let i = 0; i < err.position; i++) {
    if (source[i] === "\n") {
      lineNumber += 1;
      lineStart = i + 1;
    }
  }

  let lineEnd = err.position + err.length;
  while (source[lineEnd] !== "\n" && lineEnd < source.length) {
    lineEnd += 1;
  }
  const line = source.slice(lineStart, lineEnd);

  return {
    lineNumber,
    column: err.position - lineStart + 1,
    line,
  };
}

// --------
//  Errors
// --------

const errors = {
  UnexpectedCharacter: "Unexpected character",
  ExpectedExpression: "Expected expression",
  MissingClosingParenthesis: "Missing closing parenthesis",
};
