import type { CompilerError, ErrorCode } from "./errors.ts";

export type Token = {
  type: TokenType;
  lexeme: string;
  literal: undefined | number | string;
  position: number;
};

export type TokenType =
  // Single-character tokens
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  // One or two character tokens
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"
  // Literals
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  // Keywords
  | "AND"
  | "CONST"
  | "ELSE"
  | "FALSE"
  | "FN"
  | "FOR"
  | "IF"
  | "LET"
  | "OR"
  | "RETURN"
  | "TRUE"
  | "WHILE"
  | "EOF";

export function scanTokens(source: string): [Token[], CompilerError[]] {
  const ctx = createScannerContext(source);

  setStart(ctx);
  while (!isAtEnd(ctx)) {
    scanToken(ctx);
    setStart(ctx);
  }
  addToken(ctx, "EOF");

  return [ctx.tokens, ctx.errors];
}

export function scanToken(ctx: ScannerContext): void {
  const c = advance(ctx);

  switch (c) {
    case "(":
      addToken(ctx, "LEFT_PAREN");
      break;
    case ")":
      addToken(ctx, "RIGHT_PAREN");
      break;
    case "{":
      addToken(ctx, "LEFT_BRACE");
      break;
    case "}":
      addToken(ctx, "RIGHT_BRACE");
      break;
    case ",":
      addToken(ctx, "COMMA");
      break;
    case ".":
      addToken(ctx, "DOT");
      break;
    case "-":
      addToken(ctx, "MINUS");
      break;
    case "+":
      addToken(ctx, "PLUS");
      break;
    case ";":
      addToken(ctx, "SEMICOLON");
      break;
    case "/":
      if (match(ctx, "/")) {
        // A comment goes until the end of the line and it's ignored
        while (peek(ctx) !== "\n" && !isAtEnd(ctx)) {
          advance(ctx);
        }
      } else {
        addToken(ctx, "SLASH");
      }
      break;
    case "*":
      addToken(ctx, "STAR");
      break;
    case "!":
      addToken(ctx, match(ctx, "=") ? "BANG_EQUAL" : "BANG");
      break;
    case "=":
      addToken(ctx, match(ctx, "=") ? "EQUAL_EQUAL" : "EQUAL");
      break;
    case "<":
      addToken(ctx, match(ctx, "=") ? "LESS_EQUAL" : "LESS");
      break;
    case ">":
      addToken(ctx, match(ctx, "=") ? "GREATER_EQUAL" : "GREATER");
      break;
    case " ":
    case "\t":
    case "\r":
    case "\n":
      break;
    default:
      if (c.match(/^[0-9]/)) {
        scanNumber(ctx);
      } else {
        addErrorAndRecover(
          ctx,
          "UnexpectedCharacter",
          `"${c}" is not a valid character`,
        );
      }
  }
}

const numberRegex = new RegExp(
  // NOTE: The order matters!
  [
    /0b[01]([01_]*[01])?/, // binary
    /0o[0-7]([0-7_]*[0-7])?/, // octal
    /0x[0-9a-fA-F]([0-9a-fA-F_]*[0-9a-fA-F])?/, // hex
    /[0-9]([0-9_]*[0-9])?(\.[0-9]([0-9_]*[0-9])?)?([eE][-+]?[0-9]([0-9_]*[0-9])?)?/, // integer, float and exponent
  ].map((r) => r.source).join("|"),
  "y",
);
function scanNumber(ctx: ScannerContext): void {
  numberRegex.lastIndex = ctx.start;
  const literal = numberRegex.exec(ctx.source);
  if (!literal) {
    addErrorAndRecover(
      ctx,
      "UnexpectedCharacter",
      "The format of the number is invalid",
    );
    return;
  }
  while (ctx.current < numberRegex.lastIndex) {
    advance(ctx);
  }
  addToken(ctx, "NUMBER", Number(literal[0].replaceAll("_", "")));
}

// -----------------
//  Scanner Context
// -----------------

type ScannerContext = {
  source: string;
  tokens: Token[];
  errors: CompilerError[];
  start: number;
  current: number;
};

function createScannerContext(source: string): ScannerContext {
  return {
    source,
    tokens: [],
    errors: [],
    start: 0,
    current: 0,
  };
}

function addToken(
  ctx: ScannerContext,
  type: TokenType,
  literal?: number | string,
): void {
  ctx.tokens.push({
    type,
    lexeme: ctx.source.slice(ctx.start, ctx.current),
    literal,
    position: ctx.start,
  });
}

function addErrorAndRecover(
  ctx: ScannerContext,
  code: ErrorCode,
  message: string,
): void {
  ctx.errors.push({
    position: ctx.start,
    length: ctx.current - ctx.start,
    code,
    message,
  });
  while (!isAtEnd(ctx) && peek(ctx) !== "\n") {
    advance(ctx);
  }
}

function isAtEnd(ctx: ScannerContext): boolean {
  return ctx.current >= ctx.source.length;
}

function setStart(ctx: ScannerContext): void {
  ctx.start = ctx.current;
}

function advance(ctx: ScannerContext): string {
  const c = ctx.source[ctx.current];
  ctx.current += 1;
  return c;
}

function match(ctx: ScannerContext, expected: string): boolean {
  if (isAtEnd(ctx)) return false;
  if (ctx.source[ctx.current] !== expected) return false;

  ctx.current += 1;
  return true;
}

function peek(ctx: ScannerContext): string {
  if (isAtEnd(ctx)) {
    return "";
  }
  return ctx.source[ctx.current];
}
