import { type Token } from "./scanner.ts";

export type ASTNode = {
  type: string;
};

export type AST = Expr;
export type Expr = GroupingExpr | BinaryExpr | UnaryExpr | LiteralExpr;

export type BinaryExpr = ASTNode & {
  type: "binaryExpr";
  op: Token<
    | "BANG_EQUAL"
    | "EQUAL_EQUAL"
    | "GREATER"
    | "GREATER_EQUAL"
    | "LESS"
    | "LESS_EQUAL"
    | "MINUS"
    | "PLUS"
    | "SLASH"
    | "STAR"
  >;
  left: Expr;
  right: Expr;
};
export type UnaryExpr = ASTNode & {
  type: "unaryExpr";
  op: Token<"BANG" | "MINUS">;
  right: Expr;
};
export type GroupingExpr = ASTNode & {
  type: "groupingExpr";
  expr: Expr;
};
export type LiteralExpr = ASTNode & {
  type: "literalExpr";
  value: number | string | boolean;
};

// -----------------
//  Print Functions
// -----------------

const SPACES = "  | ";

export function printAST(ast: AST, prefix = ""): void {
  switch (ast.type) {
    case "binaryExpr":
      return printBinaryExpr(ast, prefix);
    case "unaryExpr":
      return printUnaryExpr(ast, prefix);
    case "groupingExpr":
      return printGroupingExpr(ast, prefix);
    case "literalExpr":
      return printLiteralExpr(ast, prefix);
  }
}

export function printBinaryExpr(expr: BinaryExpr, prefix = ""): void {
  console.log(`${prefix} %c${expr.type}%c ${expr.op.type}`, "color: cyan", "");
  printAST(expr.left, prefix + SPACES);
  printAST(expr.right, prefix + SPACES);
}

function printUnaryExpr(expr: UnaryExpr, prefix = ""): void {
  console.log(prefix, expr.type, expr.op.type);
  printAST(expr.right, prefix + SPACES);
}

function printGroupingExpr(expr: GroupingExpr, prefix = ""): void {
  console.log(prefix, expr.type);
  printAST(expr.expr, prefix + SPACES);
}

function printLiteralExpr(expr: LiteralExpr, prefix = ""): void {
  console.log(prefix, expr.type, expr.value);
}
