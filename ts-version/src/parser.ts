import type { Decl, Expr, Program, Stmt } from "./ast/types.ts";
import type { CompilerError, ErrorCode } from "./errors.ts";
import type { Token, TokenType } from "./scanner.ts";

export function parse(tokens: Token[]): [Program, CompilerError[]] {
  const ctx = createParserContext(tokens);

  const stmts: (Decl | Stmt)[] = [];
  while (!isAtEnd(ctx)) {
    setStart(ctx);
    const decl = declaration(ctx);
    if (decl === null) continue;
    stmts.push(decl);
  }

  return [{
    type: "program",
    stmts,
  }, ctx.errors]; // TODO: Replace with real ctx.ast or find a better way
}

function declaration(ctx: ParserContext): Decl | Stmt | null {
  try {
    if (match(ctx, "CONST", "LET")) {
      return varDeclaration(ctx);
    }

    return statement(ctx);
  } catch (_e) {
    synchronize(ctx);
    return null;
  }
}

function varDeclaration(ctx: ParserContext): Decl {
  const isConst = peek(ctx, -1).type === "CONST";

  if (!match(ctx, "IDENTIFIER")) {
    const token = peek(ctx, -1);
    throw addError(
      ctx,
      "MissingIdentifier",
      `Missing ${isConst ? "variable" : "constant"} name after "${
        isConst ? "const" : "let"
      }"`,
      { position: token.position, length: token.lexeme.length },
    );
  }
  const name = peek(ctx, -1) as Token<"IDENTIFIER">;
  if (!match(ctx, "EQUAL")) {
    throw addError(
      ctx,
      "MissingInitializer",
      `Missing initializer for "${name.lexeme}"`,
      { position: name.position, length: name.lexeme.length },
    );
  }
  const initializer = expression(ctx);
  if (!match(ctx, "SEMICOLON")) {
    const token = peek(ctx, -1);
    throw addError(ctx, "MissingSemicolon", 'Missing ";" after initializer', { // TODO: revise
      position: token.position + token.lexeme.length,
      length: 1,
    });
  }

  return {
    type: "varDecl",
    isConst,
    name,
    initializer,
  };
}

function statement(ctx: ParserContext): Stmt {
  return expressionStatement(ctx);
}

function expressionStatement(ctx: ParserContext): Stmt {
  const expr = expression(ctx);

  if (!match(ctx, "SEMICOLON")) {
    const token = peek(ctx);
    throw addError(ctx, "MissingSemicolon", 'Missing ";" after expression', { // TODO: revise
      position: token.position + token.lexeme.length,
      length: 1,
    });
  }

  return { type: "exprStmt", expr };
}

function expression(ctx: ParserContext): Expr {
  return equality(ctx);
}

function equality(ctx: ParserContext): Expr {
  let expr = comparison(ctx);

  const validOps = ["BANG_EQUAL", "EQUAL_EQUAL"] satisfies TokenType[];
  while (match(ctx, ...validOps)) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1) as Token<typeof validOps[number]>,
      left: expr,
      right: comparison(ctx),
    };
  }

  return expr;
}

function comparison(ctx: ParserContext): Expr {
  let expr = term(ctx);

  const validOps = [
    "GREATER",
    "GREATER_EQUAL",
    "LESS",
    "LESS_EQUAL",
  ] satisfies TokenType[];
  while (match(ctx, ...validOps)) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1) as Token<typeof validOps[number]>,
      left: expr,
      right: term(ctx),
    };
  }

  return expr;
}

function term(ctx: ParserContext): Expr {
  let expr = factor(ctx);

  const validOps = ["MINUS", "PLUS"] satisfies TokenType[];
  while (match(ctx, ...validOps)) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1) as Token<typeof validOps[number]>,
      left: expr,
      right: factor(ctx),
    };
  }

  return expr;
}

function factor(ctx: ParserContext): Expr {
  let expr = unary(ctx);

  const validOps = ["SLASH", "STAR"] satisfies TokenType[];
  while (match(ctx, ...validOps)) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1) as Token<typeof validOps[number]>,
      left: expr,
      right: unary(ctx),
    };
  }

  return expr;
}

function unary(ctx: ParserContext): Expr {
  const validOps = ["BANG", "MINUS"] satisfies TokenType[];
  if (match(ctx, ...validOps)) {
    return {
      type: "unaryExpr",
      op: peek(ctx, -1) as Token<typeof validOps[number]>,
      right: primary(ctx),
    };
  }

  return primary(ctx);
}

function primary(ctx: ParserContext): Expr {
  if (match(ctx, "FALSE")) return { type: "literalExpr", value: false };
  if (match(ctx, "TRUE")) return { type: "literalExpr", value: true };
  if (match(ctx, "NUMBER")) {
    return { type: "literalExpr", value: Number(peek(ctx, -1).literal) };
  }
  if (match(ctx, "STRING")) {
    return { type: "literalExpr", value: String(peek(ctx, -1).literal) };
  }

  if (match(ctx, "IDENTIFIER")) {
    return { type: "variableExpr", name: peek(ctx, -1) as Token<"IDENTIFIER"> };
  }

  if (match(ctx, "LEFT_PAREN")) {
    const position = peek(ctx, -1).position;
    const expr = expression(ctx);
    if (!match(ctx, "RIGHT_PAREN")) {
      throw addError(
        ctx,
        "MissingClosingParenthesis",
        "Missing closing parenthesis",
        { position, length: 1 },
      );
    }
    return { type: "groupingExpr", expr };
  }

  setStart(ctx);
  throw addError(ctx, "ExpectedExpression", "This is not a valid expression");
}

// ----------------
//  Parser Context
// ----------------

type ParserContext = {
  tokens: Token[];
  errors: CompilerError[];
  start: number;
  current: number;
};

function createParserContext(tokens: Token[]): ParserContext {
  return {
    tokens,
    errors: [],
    start: 0,
    current: 0,
  };
}

class ParserException extends Error {
  constructor() {
    super();
    this.name = "ParserError";
  }
}

function addError(
  ctx: ParserContext,
  code: ErrorCode,
  message: string,
  options?: { position: number; length: number },
): ParserException {
  if (options) {
    ctx.errors.push({
      position: options.position,
      length: options.length,
      code,
      message,
    });
  } else {
    const start = ctx.tokens[ctx.start];
    const current = ctx.tokens[ctx.current];
    ctx.errors.push({
      position: start.position,
      length: current.position + current.lexeme.length - start.position,
      code,
      message,
    });
  }
  return new ParserException();
}

function synchronize(ctx: ParserContext): void {
  advance(ctx);
  while (!isAtEnd(ctx) && peek(ctx).type !== "EOF") {
    if (peek(ctx).type === "SEMICOLON") return;

    switch (peek(ctx).type) {
      case "CONST":
      case "LET":
      case "RETURN":
        return;
    }

    advance(ctx);
  }
}

function isAtEnd(ctx: ParserContext): boolean {
  return ctx.current >= ctx.tokens.length || peek(ctx).type === "EOF";
}

function setStart(ctx: ParserContext): void {
  ctx.start = ctx.current;
}

function match(ctx: ParserContext, ...types: TokenType[]): boolean {
  for (const type of types) {
    if (check(ctx, type)) {
      advance(ctx);
      return true;
    }
  }

  return false;
}

function check(ctx: ParserContext, type: TokenType): boolean {
  if (isAtEnd(ctx)) {
    return false;
  }
  return peek(ctx).type === type;
}

function advance(ctx: ParserContext): Token {
  if (!isAtEnd(ctx)) {
    ctx.current += 1;
  }
  return peek(ctx, -1);
}

function peek(ctx: ParserContext, offset = 0): Token {
  return ctx.tokens[ctx.current + offset];
}
