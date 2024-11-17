import type { Pop } from "../utils.ts";
import type {
  Assignment,
  AST,
  BinaryExpr,
  Block,
  BlockStmt,
  BooleanLiteralExpr,
  ExprStmt,
  GroupingExpr,
  IfStmt,
  NumberLiteralExpr,
  Program,
  StringLiteralExpr,
  UnaryExpr,
  VarDecl,
  VariableExpr,
} from "./types.ts";

export type VisitorWithCtx<Ctx = undefined> = {
  visitProgram?: (program: Program, ctx: Ctx) => Ctx;
  visitVarDecl?: (decl: VarDecl, ctx: Ctx) => Ctx;
  visitExprStmt?: (stmt: ExprStmt, ctx: Ctx) => Ctx;
  visitAssignment?: (stmt: Assignment, ctx: Ctx) => Ctx;
  visitBlockStmt?: (stmt: BlockStmt, ctx: Ctx) => Ctx;
  visitBlock?: (block: Block, ctx: Ctx) => Ctx;
  visitIfStmt?: (stmt: IfStmt, ctx: Ctx) => Ctx;
  visitBinaryExpr?: (expr: BinaryExpr, ctx: Ctx) => Ctx;
  visitUnaryExpr?: (expr: UnaryExpr, ctx: Ctx) => Ctx;
  visitGroupingExpr?: (expr: GroupingExpr, ctx: Ctx) => Ctx;
  visitNumberLiteralExpr?: (expr: NumberLiteralExpr, ctx: Ctx) => Ctx;
  visitStringLiteralExpr?: (expr: StringLiteralExpr, ctx: Ctx) => Ctx;
  visitBooleanLiteralExpr?: (expr: BooleanLiteralExpr, ctx: Ctx) => Ctx;
  visitVariableExpr?: (expr: VariableExpr, ctx: Ctx) => Ctx;
};
export type Visitor = {
  [K in keyof Required<VisitorWithCtx<undefined>>]?: (
    ...args: Pop<Parameters<Required<VisitorWithCtx<undefined>>[K]>>
  ) => void;
};

export function visitAST(ast: AST, visitor: Visitor): void {
  visitASTWithCtx(ast, undefined, visitor);
}
export function visitAllAST(ast: AST, visitor: Required<Visitor>): void {
  visitAllASTWithCtx(ast, undefined, visitor);
}
export function visitAllASTWithCtx<Ctx>(
  ast: AST,
  ctx: Ctx,
  visitor: Required<VisitorWithCtx<Ctx>>,
): void {
  visitASTWithCtx(ast, ctx, visitor);
}
export function visitASTWithCtx<Ctx>(
  ast: AST,
  ctx: Ctx,
  visitor: VisitorWithCtx<Ctx>,
): void {
  let newCtx: Ctx = ctx;
  switch (ast.type) {
    case "program":
      newCtx = visitor.visitProgram?.(ast, ctx) ?? newCtx;
      for (const stmt of ast.stmts) {
        visitASTWithCtx(stmt, newCtx, visitor);
      }
      break;
    case "varDecl":
      newCtx = visitor.visitVarDecl?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.initializer, newCtx, visitor);
      break;
    case "exprStmt":
      newCtx = visitor.visitExprStmt?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.expr, newCtx, visitor);
      break;
    case "assignment":
      newCtx = visitor.visitAssignment?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.expression, newCtx, visitor);
      break;
    case "blockStmt":
      newCtx = visitor.visitBlockStmt?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.block, newCtx, visitor);
      break;
    case "block":
      newCtx = visitor.visitBlock?.(ast, ctx) ?? newCtx;
      for (const stmt of ast.stmts) {
        visitASTWithCtx(stmt, newCtx, visitor);
      }
      break;
    case "ifStmt":
      newCtx = visitor.visitIfStmt?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.condition, newCtx, visitor);
      visitASTWithCtx(ast.thenBranch, newCtx, visitor);
      if (ast.elseBranch) {
        visitASTWithCtx(ast.elseBranch, newCtx, visitor);
      }
      break;
    case "binaryExpr":
      newCtx = visitor.visitBinaryExpr?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.left, newCtx, visitor);
      visitASTWithCtx(ast.right, newCtx, visitor);
      break;
    case "unaryExpr":
      newCtx = visitor.visitUnaryExpr?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.right, newCtx, visitor);
      break;
    case "groupingExpr":
      newCtx = visitor.visitGroupingExpr?.(ast, ctx) ?? newCtx;
      visitASTWithCtx(ast.expr, newCtx, visitor);
      break;
    case "numberLiteralExpr":
      newCtx = visitor.visitNumberLiteralExpr?.(ast, ctx) ?? newCtx;
      break;
    case "stringLiteralExpr":
      newCtx = visitor.visitStringLiteralExpr?.(ast, ctx) ?? newCtx;
      break;
    case "booleanLiteralExpr":
      newCtx = visitor.visitBooleanLiteralExpr?.(ast, ctx) ?? newCtx;
      break;
    case "variableExpr":
      newCtx = visitor.visitVariableExpr?.(ast, ctx) ?? newCtx;
      break;
  }
}
