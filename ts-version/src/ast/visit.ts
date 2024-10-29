import type { Pop } from "../utils.ts";
import type {
  AST,
  BinaryExpr,
  ExprStmt,
  GroupingExpr,
  LiteralExpr,
  Program,
  UnaryExpr,
  VarDecl,
} from "./types.ts";

export type VisitorWithCtx<Ctx = undefined> = {
  visitProgram?: (program: Program, ctx: Ctx) => Ctx;
  visitVarDecl?: (decl: VarDecl, ctx: Ctx) => Ctx;
  visitExprStmt?: (stmt: ExprStmt, ctx: Ctx) => Ctx;
  visitBinaryExpr?: (expr: BinaryExpr, ctx: Ctx) => Ctx;
  visitUnaryExpr?: (expr: UnaryExpr, ctx: Ctx) => Ctx;
  visitGroupingExpr?: (expr: GroupingExpr, ctx: Ctx) => Ctx;
  visitLiteralExpr?: (expr: LiteralExpr, ctx: Ctx) => Ctx;
};
export type Visitor = {
  [K in keyof Required<VisitorWithCtx<undefined>>]?: (
    ...args: Pop<Parameters<Required<VisitorWithCtx<undefined>>[K]>>
  ) => void;
};

export function visitAST(ast: AST, visitor: Visitor) {
  visitASTWithCtx(ast, undefined, visitor);
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
    case "literalExpr":
      newCtx = visitor.visitLiteralExpr?.(ast, ctx) ?? newCtx;
      break;
  }
}
