import type { ASTNode, Expr } from "./ast.ts";
import type { CompilerError } from "./errors.ts";
import type { Token, TokenType } from "./scanner.ts";

export function parse(tokens: Token[]): [ASTNode, CompilerError[]] {
  const ctx = createParserContext(tokens);

  const ast = expression(ctx);

  return [ast, ctx.errors]; // TODO: Replace with real ctx.ast or find a better way
}

function expression(ctx: ParserContext): Expr {
  return equality(ctx);
}

function equality(ctx: ParserContext): Expr {
  let expr = comparison(ctx);

  while (match(ctx, "BANG_EQUAL", "EQUAL_EQUAL")) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1),
      left: expr,
      right: comparison(ctx),
    };
  }

  return expr;
}

function comparison(ctx: ParserContext): Expr {
  let expr = term(ctx);

  while (match(ctx, "GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1),
      left: expr,
      right: term(ctx),
    };
  }

  return expr;
}

function term(ctx: ParserContext): Expr {
  let expr = factor(ctx);

  while (match(ctx, "MINUS", "PLUS")) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1),
      left: expr,
      right: factor(ctx),
    };
  }

  return expr;
}

function factor(ctx: ParserContext): Expr {
  let expr = unary(ctx);

  while (match(ctx, "SLASH", "STAR")) {
    expr = {
      type: "binaryExpr",
      op: peek(ctx, -1),
      left: expr,
      right: unary(ctx),
    };
  }

  return expr;
}

function unary(ctx: ParserContext): Expr {
  if (match(ctx, "BANG", "MINUS")) {
    return {
      type: "unaryExpr",
      op: peek(ctx, -1),
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
    const expr = expression(ctx);
    if (match(ctx, "RIGHT_PAREN")) {
      return { type: "groupingExpr", expr };
    }
  }

  throw new Error(); // TODO: Error
}

// ----------------
//  Parser Context
// ----------------

type ParserContext = {
  tokens: Token[];
  ast: ASTNode;
  errors: CompilerError[];
  start: number;
  current: number;
};

function createParserContext(tokens: Token[]): ParserContext {
  return {
    tokens,
    ast: { type: "EOF" }, // TODO: Replace with real AST
    errors: [],
    start: 0,
    current: 0,
  };
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
