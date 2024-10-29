import { type Token } from "../scanner.ts";

export type ASTNode = {
  type: string;
};

export type AST = Program | Decl | Stmt | Expr;
export type Decl = VarDecl;
export type Stmt = ExprStmt;
export type Expr =
  | GroupingExpr
  | BinaryExpr
  | UnaryExpr
  | VariableExpr
  | LiteralExpr;

export type Program = ASTNode & {
  type: "program";
  stmts: (Decl | Stmt)[];
};

export type VarDecl = ASTNode & {
  type: "varDecl";
  isConst: boolean;
  name: Token<"IDENTIFIER">;
  initializer: Expr;
};

export type ExprStmt = ASTNode & {
  type: "exprStmt";
  expr: Expr;
};

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
export type VariableExpr = ASTNode & {
  type: "variableExpr";
  name: Token<"IDENTIFIER">;
};
export type LiteralExpr = ASTNode & {
  type: "literalExpr";
  value: number | string | boolean;
};
