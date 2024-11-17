import {
  type Block,
  type Decl,
  type DeclOrStmt,
  type Expr,
  IfStmt,
  type Program,
  type Stmt,
} from "./ast/types.ts";
import type { CompilerError, ErrorCode } from "./errors.ts";
import type { Token, TokenType } from "./tokens.ts";

export function parse(tokens: Token[]): [Program, CompilerError[]] {
  const ctx = createParserContext(tokens);

  const stmts: DeclOrStmt[] = [];
  while (!isAtEnd(ctx)) {
    setStart(ctx);
    const decl = declaration(ctx);
    if (decl === null) continue;
    stmts.push(decl);
  }

  return [{
    type: "program",
    stmts,
  }, ctx.errors];
}

function declaration(ctx: ParserContext): DeclOrStmt | null {
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
  if (match(ctx, "IF")) {
    return ifStatement(ctx);
  }
  if (match(ctx, "LEFT_BRACE")) {
    const blk = block(ctx);
    return {
      type: "blockStmt",
      block: blk,
    };
  }
  return assignment(ctx);
}

function ifStatement(ctx: ParserContext): IfStmt {
  if (!match(ctx, "LEFT_PAREN")) {
    const token = peek(ctx);
    throw addError(
      ctx,
      "MissingCondition",
      "Missing condition",
      { position: token.position, length: 1 },
    );
  }
  const condition = expression(ctx);
  if (!match(ctx, "RIGHT_PAREN")) {
    const token = peek(ctx, -1);
    throw addError(
      ctx,
      "MissingClosingParenthesis",
      "Missing closing parenthesis",
      { position: token.position + token.lexeme.length, length: 1 },
    );
  }

  if (!match(ctx, "LEFT_BRACE")) {
    const token = peek(ctx, -1);
    throw addError(
      ctx,
      "ExpectedBlock",
      "Expected block after the condition",
      { position: token.position + token.lexeme.length, length: 1 },
    );
  }
  const thenBranch = block(ctx);

  if (!match(ctx, "ELSE")) {
    return {
      type: "ifStmt",
      condition,
      thenBranch,
    };
  }
  let elseBranch: Block | IfStmt;
  if (match(ctx, "LEFT_BRACE")) {
    elseBranch = block(ctx);
  } else if (match(ctx, "IF")) {
    elseBranch = ifStatement(ctx);
  } else {
    const token = peek(ctx, -1);
    throw addError(
      ctx,
      "ExpectedBlock",
      "Expected block after else",
      { position: token.position, length: 1 },
    );
  }

  return {
    type: "ifStmt",
    condition,
    thenBranch,
    elseBranch,
  };
}

// TODO: decide if the left brace should be checked in this function
function block(ctx: ParserContext): Block {
  const stmts: DeclOrStmt[] = [];
  while (!check(ctx, "RIGHT_BRACE") && !isAtEnd(ctx)) {
    const stmt = declaration(ctx);
    if (stmt === null) continue;
    stmts.push(stmt);
  }

  if (!match(ctx, "RIGHT_BRACE")) {
    const token = peek(ctx);
    throw addError(
      ctx,
      "MissingClosingBrace",
      "Missing closing brace",
      { position: token.position, length: 1 },
    );
  }
  return {
    type: "block",
    stmts,
  };
}

function assignment(ctx: ParserContext): Stmt {
  setStart(ctx);
  const expr: Expr = expression(ctx);

  let stmt: Stmt = { type: "exprStmt", expr };
  if (match(ctx, "EQUAL")) {
    const value = expression(ctx);

    if (expr.type !== "variableExpr") {
      throw addError(
        ctx,
        "InvalidAssignment",
        "Invalid assignment target",
      );
    }

    const name = expr.name;
    stmt = {
      type: "assignment",
      name,
      expression: value,
    };
  }

  if (!match(ctx, "SEMICOLON")) {
    const token = peek(ctx);
    throw addError(
      ctx,
      "MissingSemicolon",
      `Missing ";" after ${
        stmt.type === "assignment" ? "assignment" : "expression"
      }`,
      { // TODO: revise
        position: token.position + token.lexeme.length,
        length: 1,
      },
    );
  }

  return stmt;
}

function expression(ctx: ParserContext): Expr {
  setStart(ctx);
  return equality(ctx);
}

function equality(ctx: ParserContext): Expr {
  let expr = comparison(ctx);

  const validOps = ["BANG_EQUAL", "EQUAL_EQUAL"] satisfies TokenType[];
  while (match(ctx, ...validOps)) {
    expr = {
      type: "binaryExpr",
      op: peek<typeof validOps[number]>(ctx, -1),
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
      op: peek<typeof validOps[number]>(ctx, -1),
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
      op: peek<typeof validOps[number]>(ctx, -1),
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
      op: peek<typeof validOps[number]>(ctx, -1),
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
      op: peek<typeof validOps[number]>(ctx, -1),
      right: primary(ctx),
    };
  }

  return primary(ctx);
}

function primary(ctx: ParserContext): Expr {
  if (match(ctx, "FALSE")) {
    return {
      type: "booleanLiteralExpr",
      token: peek<"FALSE">(ctx, -1),
      value: false,
    };
  }
  if (match(ctx, "TRUE")) {
    return {
      type: "booleanLiteralExpr",
      token: peek<"TRUE">(ctx, -1),
      value: true,
    };
  }
  if (match(ctx, "NUMBER")) {
    return {
      type: "numberLiteralExpr",
      token: peek<"NUMBER">(ctx, -1),
      value: Number(peek(ctx, -1).literal),
    };
  }
  if (match(ctx, "STRING")) {
    return {
      type: "stringLiteralExpr",
      token: peek<"STRING">(ctx, -1),
      value: String(peek(ctx, -1).literal),
    };
  }

  if (match(ctx, "IDENTIFIER")) {
    return { type: "variableExpr", name: peek<"IDENTIFIER">(ctx, -1) };
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

  const startToken = peekStart(ctx);
  throw addError(
    ctx,
    "ExpectedExpression",
    `Expected expression, found "${startToken.lexeme}"`,
    { position: startToken.position, length: 1 },
  );
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
      type: "error",
      position: options.position,
      length: options.length,
      code,
      message,
    });
  } else {
    const start = ctx.tokens[ctx.start];
    const current = ctx.tokens[ctx.current];
    ctx.errors.push({
      type: "error",
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
  while (!isAtEnd(ctx)) {
    if (peek(ctx, -1).type === "SEMICOLON") return;

    switch (peek(ctx, -1).type) {
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

function advance<T extends TokenType = TokenType>(
  ctx: ParserContext,
): Token<T> {
  if (!isAtEnd(ctx)) {
    ctx.current += 1;
  }
  return peek<T>(ctx, -1);
}

function peek<T extends TokenType = TokenType>(
  ctx: ParserContext,
  offset = 0,
): Token<T> {
  return ctx.tokens[ctx.current + offset] as Token<T>;
}

function peekStart<T extends TokenType = TokenType>(
  ctx: ParserContext,
  offset = 0,
): Token<T> {
  return ctx.tokens[ctx.start + offset] as Token<T>;
}
