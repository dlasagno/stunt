import {
  Assignment,
  BinaryExpr,
  Block,
  BlockStmt,
  BooleanLiteralExpr,
  DeclOrStmt,
  Expr,
  ExprStmt,
  GroupingExpr,
  IfStmt,
  NumberLiteralExpr,
  Program,
  StringLiteralExpr,
  UnaryExpr,
  VarDecl,
  VariableExpr,
} from "../ast/types.ts";
import { CompilerError, ErrorCode } from "../errors.ts";
import {
  addReference,
  addVariable,
  createEnvironment,
  Environment,
  getUnusedVariables,
  getVariable,
} from "./environment.ts";

export function analyze(ast: Program): CompilerError[] {
  const ctx = createAnalyzerContext();

  for (const decl of ast.stmts) {
    analyzeStmt(ctx, decl);
  }

  for (const variable of getUnusedVariables(ctx.env)) {
    addError(
      ctx,
      {
        type: "warning",
        code: "UnusedVariable",
        message: `Variable "${variable.declaration.name.lexeme}" is unused`,
        position: variable.declaration.name.position,
        length: variable.declaration.name.lexeme.length,
      },
    );
  }

  return ctx.errors;
}

function analyzeStmt(
  ctx: AnalyzerContext,
  decl: DeclOrStmt,
): void {
  switch (decl.type) {
    case "varDecl":
      analyzeVarDecl(ctx, decl);
      break;
    case "assignment":
      analyzeAssignment(ctx, decl);
      break;
    case "exprStmt":
      analyzeExprStmt(ctx, decl);
      break;
    case "blockStmt":
      analyzeBlockStmt(ctx, decl);
      break;
    case "ifStmt":
      analyzeIfStmt(ctx, decl);
      break;
  }
}

function analyzeVarDecl(ctx: AnalyzerContext, decl: VarDecl): void {
  if (!addVariable(ctx.env, decl)) {
    addError(
      ctx,
      {
        code: "MultipleDeclarations",
        message: `Variable "${decl.name.lexeme}" is already declared`,
        position: decl.name.position,
        length: decl.name.lexeme.length,
      },
    );
  }
}

function analyzeAssignment(ctx: AnalyzerContext, assignment: Assignment): void {
  const variable = getVariable(ctx.env, assignment.name.lexeme);
  if (!variable) {
    addError(
      ctx,
      {
        code: "UndefinedVariable",
        message: `Variable "${assignment.name.lexeme}" is not defined`,
        position: assignment.name.position,
        length: assignment.name.lexeme.length,
      },
    );
  }
  analyzeExpr(ctx, assignment.expression);
}

function analyzeBlockStmt(ctx: AnalyzerContext, stmt: BlockStmt): void {
  analyzeBlock(ctx, stmt.block);
}

function analyzeBlock(ctx: AnalyzerContext, block: Block): void {
  for (const stmt of block.stmts) {
    analyzeStmt(ctx, stmt);
  }
}

function analyzeIfStmt(ctx: AnalyzerContext, stmt: IfStmt): void {
  analyzeExpr(ctx, stmt.condition);
  analyzeBlock(ctx, stmt.thenBranch);
  if (stmt.elseBranch) {
    if (stmt.elseBranch.type === "block") {
      analyzeBlock(ctx, stmt.elseBranch);
    } else {
      analyzeIfStmt(ctx, stmt.elseBranch);
    }
  }
}

function analyzeExprStmt(ctx: AnalyzerContext, stmt: ExprStmt): void {
  analyzeExpr(ctx, stmt.expr);
}

function analyzeExpr(ctx: AnalyzerContext, expr: Expr): void {
  switch (expr.type) {
    case "binaryExpr":
      analyzeBinaryExpr(ctx, expr);
      break;
    case "unaryExpr":
      analyzeUnaryExpr(ctx, expr);
      break;
    case "groupingExpr":
      analyzeGroupingExpr(ctx, expr);
      break;
    case "numberLiteralExpr":
    case "stringLiteralExpr":
    case "booleanLiteralExpr":
      analyzeLiteralExpr(ctx, expr);
      break;
    case "variableExpr":
      analyzeVariableExpr(ctx, expr);
      break;
  }
}

function analyzeBinaryExpr(ctx: AnalyzerContext, expr: BinaryExpr): void {
  analyzeExpr(ctx, expr.left);
  analyzeExpr(ctx, expr.right);
}

function analyzeUnaryExpr(ctx: AnalyzerContext, expr: UnaryExpr): void {
  analyzeExpr(ctx, expr.right);
}

function analyzeGroupingExpr(ctx: AnalyzerContext, expr: GroupingExpr): void {
  analyzeExpr(ctx, expr.expr);
}

function analyzeLiteralExpr(
  ctx: AnalyzerContext,
  expr: NumberLiteralExpr | StringLiteralExpr | BooleanLiteralExpr,
): void {
  // TODO: Check if the literal is valid
}

function analyzeVariableExpr(ctx: AnalyzerContext, expr: VariableExpr): void {
  const variable = getVariable(ctx.env, expr.name.lexeme);
  if (!variable) {
    addError(
      ctx,
      {
        code: "UndefinedVariable",
        message: `Variable "${expr.name.lexeme}" is not defined`,
        position: expr.name.position,
        length: expr.name.lexeme.length,
      },
    );
  }
  addReference(ctx.env, expr.name.lexeme, expr);
}

// ------------------
//  Analyzer Context
// ------------------

type AnalyzerContext = {
  env: Environment;
  errors: CompilerError[];
};

function createAnalyzerContext(): AnalyzerContext {
  return {
    env: createEnvironment(),
    errors: [],
  };
}

function addError(
  ctx: AnalyzerContext,
  err: {
    type?: "error" | "warning";
    code: ErrorCode;
    message: string;
    position: number;
    length: number;
  },
): void {
  ctx.errors.push({
    type: "error",
    ...err,
  });
}
