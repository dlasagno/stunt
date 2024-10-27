import type {
  BinaryExpr,
  Expr,
  ExprStmt,
  GroupingExpr,
  LiteralExpr,
  Program,
  Stmt,
  UnaryExpr,
} from "./ast.ts";

export function generate(ast: Program): string {
  let str = "";

  for (let i = 0; i < ast.stmts.length; i++) {
    str += generateStatement(ast.stmts[i]) + "\n";
  }

  return str;
}

function generateStatement(stmt: Stmt): string {
  switch (stmt.type) {
    case "exprStmt":
      return generateExprStmt(stmt);
  }
}

function generateExprStmt(stmt: ExprStmt): string {
  return generateExpr(stmt.expr) + ";";
}

function generateExpr(expr: Expr): string {
  switch (expr.type) {
    case "binaryExpr":
      return generateBinaryExpr(expr);
    case "groupingExpr":
      return generateGroupingExpr(expr);
    case "literalExpr":
      return generateLiteralExpr(expr);
    case "unaryExpr":
      return generateUnaryExpr(expr);
  }
}

function generateBinaryExpr(expr: BinaryExpr): string {
  const left = generateExpr(expr.left);
  const right = generateExpr(expr.right);

  switch (expr.op.type) {
    case "BANG_EQUAL":
      return left + "!==" + right;
    case "EQUAL_EQUAL":
      return left + "===" + right;
    case "GREATER":
      return left + ">" + right;
    case "GREATER_EQUAL":
      return left + ">=" + right;
    case "LESS":
      return left + "<" + right;
    case "LESS_EQUAL":
      return left + "<=" + right;
    case "MINUS":
      return left + "-" + right;
    case "PLUS":
      return left + "+" + right;
    case "SLASH":
      return left + "/" + right;
    case "STAR":
      return left + "*" + right;
  }
}

function generateUnaryExpr(expr: UnaryExpr): string {
  const right = generateExpr(expr.right);

  switch (expr.op.type) {
    case "BANG":
      return "!" + right;
    case "MINUS":
      return "-" + right;
  }
}

function generateGroupingExpr(expr: GroupingExpr): string {
  return "(" + generateExpr(expr.expr) + ")";
}

function generateLiteralExpr(expr: LiteralExpr): string {
  switch (typeof expr.value) {
    case "number":
      return expr.value.toString();
    case "string":
      return JSON.stringify(expr.value);
    case "boolean":
      return expr.value ? "true" : "false";
  }
}
