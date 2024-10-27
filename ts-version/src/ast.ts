import { type Token } from "./scanner.ts";

export type ASTNode = {
  type: string;
};

export type AST = Program | Stmt | Expr;
export type Stmt = ExprStmt;
export type Expr = GroupingExpr | BinaryExpr | UnaryExpr | LiteralExpr;

export type Program = ASTNode & {
  type: "program";
  stmts: Stmt[];
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
export type LiteralExpr = ASTNode & {
  type: "literalExpr";
  value: number | string | boolean;
};

// -----------------
//  Print Functions
// -----------------

const SPACES = " │";

function printEntry(
  prefix: string,
  last: boolean,
  ...elements: [string, string?][]
): void {
  const str = elements.map(([elem]) => "%c" + elem).join(" ");
  const colors = elements.map(([, color]) => color ? "color: " + color : "");
  let pfx = prefix;
  if (prefix.length > 0) {
    if (last) {
      pfx = prefix.slice(0, -1) + "└";
    } else {
      pfx = prefix.slice(0, -1) + "├";
    }
  }
  console.log(`${pfx}─${str}`, ...colors);
}

function fmtPrefix(prefix: string, last = true): string {
  if (!last || prefix.length < 2) return prefix + SPACES;
  return prefix.slice(0, -2) + "  " + SPACES;
}

export function printAST(ast: AST, prefix = "", last = true): void {
  switch (ast.type) {
    case "program":
      return printProgram(ast, prefix, last);
    case "exprStmt":
      return printExprStmt(ast, prefix, last);
    case "binaryExpr":
      return printBinaryExpr(ast, prefix, last);
    case "unaryExpr":
      return printUnaryExpr(ast, prefix, last);
    case "groupingExpr":
      return printGroupingExpr(ast, prefix, last);
    case "literalExpr":
      return printLiteralExpr(ast, prefix, last);
  }
}

function printProgram(program: Program, prefix = "", last = true): void {
  printEntry(prefix, last, ["program", "cyan"]);
  const pfx = fmtPrefix(prefix, last);
  for (let i = 0; i < program.stmts.length; i++) {
    printAST(program.stmts[i], pfx, i === program.stmts.length - 1);
  }
}

function printExprStmt(stmt: ExprStmt, prefix = "", last = true): void {
  printEntry(prefix, last, ["exprStmt", "cyan"]);
  const pfx = fmtPrefix(prefix, last);
  printAST(stmt.expr, pfx);
}

export function printBinaryExpr(
  expr: BinaryExpr,
  prefix = "",
  last = true,
): void {
  printEntry(prefix, last, ["binaryExpr", "cyan"], [expr.op.type]);
  const pfx = fmtPrefix(prefix, last);
  printAST(expr.left, pfx, false);
  printAST(expr.right, pfx);
}

function printUnaryExpr(expr: UnaryExpr, prefix = "", last = true): void {
  printEntry(prefix, last, ["unaryExpr", "cyan"], [expr.op.type]);
  const pfx = fmtPrefix(prefix, last);
  printAST(expr.right, pfx);
}

function printGroupingExpr(expr: GroupingExpr, prefix = "", last = true): void {
  printEntry(prefix, last, ["groupingExpr", "cyan"]);
  const pfx = fmtPrefix(prefix, last);
  printAST(expr.expr, pfx);
}

function printLiteralExpr(expr: LiteralExpr, prefix = "", last = true): void {
  printEntry(
    prefix,
    last,
    ["literalExpr", "cyan"],
    [String(expr.value), "yellow"],
  );
}
