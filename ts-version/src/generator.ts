import type {
  BinaryExpr,
  Decl,
  Expr,
  ExprStmt,
  GroupingExpr,
  LiteralExpr,
  Program,
  Stmt,
  UnaryExpr,
  VarDecl,
  VariableExpr,
} from "./ast/types.ts";

export function generate(ast: Program): string {
  let str = "";

  for (let i = 0; i < ast.stmts.length; i++) {
    const node = ast.stmts[i];
    if (node.type === "varDecl") {
      str += generateDeclaration(node) + "\n";
    } else {
      str += generateStatement(node) + "\n";
    }
  }

  return str;
}

function generateDeclaration(decl: Decl): string {
  switch (decl.type) {
    case "varDecl":
      return generateVarDecl(decl);
  }
}

function generateVarDecl(decl: VarDecl): string {
  const keyword = decl.isConst ? "const" : "let";
  return `${keyword} ${decl.name.lexeme} = ${generateExpr(decl.initializer)};`;
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
    case "unaryExpr":
      return generateUnaryExpr(expr);
    case "groupingExpr":
      return generateGroupingExpr(expr);
    case "variableExpr":
      return generateVariableExpr(expr);
    case "literalExpr":
      return generateLiteralExpr(expr);
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

function generateVariableExpr(expr: VariableExpr): string {
  return expr.name.lexeme;
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
