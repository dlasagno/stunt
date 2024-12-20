import { type Token } from "../tokens.ts";

export type ASTNode = {
  type: string;
};

export type AST = Program | Decl | Stmt | Block | Expr;
export type DeclOrStmt = Decl | Stmt;
export type Decl = VarDecl;
export type Stmt = ExprStmt | Assignment | BlockStmt | IfStmt;
export type Expr =
  | GroupingExpr
  | BinaryExpr
  | UnaryExpr
  | VariableExpr
  | NumberLiteralExpr
  | StringLiteralExpr
  | BooleanLiteralExpr;

export type Program = ASTNode & {
  type: "program";
  stmts: DeclOrStmt[];
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
export type Assignment = ASTNode & {
  type: "assignment";
  name: Token<"IDENTIFIER">;
  expression: Expr;
};
export type BlockStmt = ASTNode & {
  type: "blockStmt";
  block: Block;
};

export type Block = ASTNode & {
  type: "block";
  stmts: DeclOrStmt[];
};
// export type EvalBlock = ASTNode & {
//   type: "evaluableBlock";
//   stmts: DeclOrStmt[];
//   value: Expr;
// };

export type IfStmt = ASTNode & {
  type: "ifStmt";
  condition: Expr;
  thenBranch: Block;
  elseBranch?: Block | IfStmt;
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
export type NumberLiteralExpr = ASTNode & {
  type: "numberLiteralExpr";
  token: Token<"NUMBER">;
  value: number;
};
export type StringLiteralExpr = ASTNode & {
  type: "stringLiteralExpr";
  token: Token<"STRING">;
  value: string;
};
export type BooleanLiteralExpr = ASTNode & {
  type: "booleanLiteralExpr";
  token: Token<"TRUE" | "FALSE">;
  value: boolean;
};
