import type { Expr, Program, Stmt } from "./ast.ts";
import type { CompilerError, ErrorCode } from "./errors.ts";
import type { Token, TokenType } from "./scanner.ts";

export function parse(tokens: Token[]): [Program, CompilerError[]] {
  const ctx = createParserContext(tokens);

  // try {
  //   const ast = expression(ctx);
  //   return [ast, ctx.errors]; // TODO: Replace with real ctx.ast or find a better way
  // } catch (_e) {
  //   // TODO: synchronize
  // }
  const stmts: Stmt[] = [];
  while (!isAtEnd(ctx)) {
    try {
      stmts.push(statement(ctx));
    } catch (_e) {
      // TODO: synchronize
    }
  }

  return [{
    type: "program",
    stmts,
  }, ctx.errors]; // TODO: Replace with real ctx.ast or find a better way
}

function statement(ctx: ParserContext): Stmt {
  return expressionStatement(ctx);
}

function expressionStatement(ctx: ParserContext): Stmt {
  const expr = expression(ctx);

  if (match(ctx, "SEMICOLON")) {
    return { type: "exprStmt", expr };
  }
  const token = peek(ctx);
  throw addError(ctx, "MissingSemicolon", 'Missing ";" after expression', {
    position: token.position + token.lexeme.length,
    length: 1,
  });
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

  if (match(ctx, "LEFT_PAREN")) {
    const position = peek(ctx, -1).position;
    const expr = expression(ctx);
    if (match(ctx, "RIGHT_PAREN")) {
      return { type: "groupingExpr", expr };
    } else {
      throw addError(
        ctx,
        "MissingClosingParenthesis",
        "Missing closing parenthesis",
        { position, length: 1 },
      );
    }
  }

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
  { position, length }: { position?: number; length?: number } = {},
): ParserException {
  console.log(ctx.start, ctx.current, peek(ctx).lexeme);
  const startToken = ctx.tokens[ctx.start];
  const currentToken = ctx.tokens[ctx.current];
  ctx.errors.push({
    position: position ?? startToken.position,
    length: length ??
      currentToken.position - startToken.position + currentToken.lexeme.length,
    code,
    message,
  });
  return new ParserException();
}

function _synchronize(ctx: ParserContext): void {
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
