import type {
  AST,
  BinaryExpr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "./ast.ts";

export function generate(ast: AST): string {
  let str = "";

  switch (ast.type) {
    case "binaryExpr":
      str = generateBinaryExpr(ast);
      break;
    case "groupingExpr":
      str = generateGroupingExpr(ast);
      break;
    case "literalExpr":
      str = generateLiteralExpr(ast);
      break;
    case "unaryExpr":
      str = generateUnaryExpr(ast);
      break;
  }

  return str;
}

function generateBinaryExpr(expr: BinaryExpr): string {
  const left = generate(expr.left);
  const right = generate(expr.right);

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
  const right = generate(expr.right);

  switch (expr.op.type) {
    case "BANG":
      return "!" + right;
    case "MINUS":
      return "-" + right;
  }
}

function generateGroupingExpr(expr: GroupingExpr): string {
  return "(" + generate(expr.expr) + ")";
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
