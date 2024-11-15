import type { SourceFile } from "./utils.ts";

export type CompilerError = {
  type: "error" | "warning";
  code: ErrorCode;
  message: string;
  position: number;
  length: number;
};
export type ErrorCode = keyof typeof errors;

export function logError(err: CompilerError, source: SourceFile): void {
  const details = getErrorDetails(err, source.content);
  const pad = details.lineNumber.toString().length;
  const color = `color: ${err.type === "error" ? "red" : "yellow"}`;

  console.error(
    `%c${err.type === "error" ? "Error" : "Warning"}: ${errors[err.code]}`,
    color,
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
    color,
    "",
  );
  console.error(
    `${"".padStart(pad)}| ${"".padStart(details.column - 1)}%c${
      "^".padStart(err.length, "^")
    } ${err.message}`,
    color,
  );
}

function getErrorDetails(err: CompilerError, source: string): {
  lineNumber: number;
  column: number;
  line: string;
} {
  let lineNumber = 1;
  for (let i = 0; i < err.position; i++) {
    if (source[i] === "\n") {
      lineNumber += 1;
    }
  }

  let lineStart = err.position;
  while (source[lineStart - 1] !== "\n" && lineStart > 0) {
    lineStart -= 1;
  }

  let lineEnd = lineStart;
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
  UnterminatedString: "Unterminated string",
  MissingSemicolon: "Missing semicolon",
  MissingIdentifier: "Missing identifier",
  MissingInitializer: "Missing initializer",
  ExpectedExpression: "Expected expression",
  MissingClosingParenthesis: "Missing closing parenthesis",
  MissingClosingBrace: "Missing closing brace",
  UnexpectedEvaluableBlock: "Unexpected evaluable block",
  MultipleDeclarations: "Multiple declarations",
  InvalidAssignment: "Invalid assignment",
  UndefinedVariable: "Undefined variable",
  UnusedVariable: "Unused variable",
};
