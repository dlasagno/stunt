import { Token } from "./scanner.ts";

export type ASTNode = {
  type: string;
};

export type Expr = GroupingExpr | BinaryExpr | UnaryExpr | LiteralExpr;

export type GroupingExpr = ASTNode & {
  type: "groupingExpr";
  expr: Expr;
};
export type BinaryExpr = ASTNode & {
  type: "binaryExpr";
  op: Token;
  left: Expr;
  right: Expr;
};
export type UnaryExpr = ASTNode & {
  type: "unaryExpr";
  op: Token;
  right: Expr;
};
export type LiteralExpr = ASTNode & {
  type: "literalExpr";
  value: number | string | boolean;
};
