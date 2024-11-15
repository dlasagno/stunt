import type {
  Assignment,
  BinaryExpr,
  Block,
  BlockStmt,
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
  const ctx = createGeneratorContext();

  for (let i = 0; i < ast.stmts.length; i++) {
    const node = ast.stmts[i];
    if (node.type === "varDecl") {
      generateDeclaration(ctx, node);
    } else {
      generateStatement(ctx, node);
    }
  }

  return ctx.output;
}

function generateDeclaration(ctx: GeneratorContext, decl: Decl): void {
  switch (decl.type) {
    case "varDecl":
      generateVarDecl(ctx, decl);
  }
}

function generateVarDecl(ctx: GeneratorContext, decl: VarDecl): void {
  const keyword = decl.isConst ? "const" : "let";
  write(
    ctx,
    `${keyword} ${decl.name.lexeme} = `,
    true,
  );
  generateExpr(ctx, decl.initializer);
  write(ctx, ";\n");
}

function generateStatement(ctx: GeneratorContext, stmt: Stmt): void {
  switch (stmt.type) {
    case "assignment":
      generateAssignment(ctx, stmt);
      break;
    case "exprStmt":
      generateExprStmt(ctx, stmt);
      break;
    case "blockStmt":
      generateBlockStmt(ctx, stmt);
      break;
  }
}

function generateAssignment(ctx: GeneratorContext, stmt: Assignment): void {
  write(ctx, `${stmt.name.lexeme} = `, true);
  generateExpr(ctx, stmt.expression);
  write(ctx, ";\n");
}

function generateExprStmt(ctx: GeneratorContext, stmt: ExprStmt): void {
  write(ctx, "", true);
  generateExpr(ctx, stmt.expr);
  write(ctx, ";\n");
}

function generateBlockStmt(ctx: GeneratorContext, stmt: BlockStmt): void {
  write(ctx, "", true);
  generateBlock(ctx, stmt.block);
  write(ctx, "\n");
}

function generateBlock(ctx: GeneratorContext, block: Block): void {
  write(ctx, "{\n");
  indent(ctx);

  for (const stmt of block.stmts) {
    if (stmt.type === "varDecl") {
      generateVarDecl(ctx, stmt);
      continue;
    }
    generateStatement(ctx, stmt);
  }
  outdent(ctx);
  write(ctx, "}");
}

function generateExpr(ctx: GeneratorContext, expr: Expr): void {
  switch (expr.type) {
    case "binaryExpr":
      generateBinaryExpr(ctx, expr);
      break;
    case "unaryExpr":
      generateUnaryExpr(ctx, expr);
      break;
    case "groupingExpr":
      generateGroupingExpr(ctx, expr);
      break;
    case "variableExpr":
      generateVariableExpr(ctx, expr);
      break;
    case "literalExpr":
      ``;
      generateLiteralExpr(ctx, expr);
      break;
  }
}

function generateBinaryExpr(ctx: GeneratorContext, expr: BinaryExpr): void {
  generateExpr(ctx, expr.left);

  switch (expr.op.type) {
    case "BANG_EQUAL":
      write(ctx, "!==");
      break;
    case "EQUAL_EQUAL":
      write(ctx, "===");
      break;
    case "GREATER":
      write(ctx, ">");
      break;
    case "GREATER_EQUAL":
      write(ctx, ">=");
      break;
    case "LESS":
      write(ctx, "<");
      break;
    case "LESS_EQUAL":
      write(ctx, "<=");
      break;
    case "MINUS":
      write(ctx, "-");
      break;
    case "PLUS":
      write(ctx, "+");
      break;
    case "SLASH":
      write(ctx, "/");
      break;
    case "STAR":
      write(ctx, "*");
      break;
  }

  generateExpr(ctx, expr.right);
}

function generateUnaryExpr(ctx: GeneratorContext, expr: UnaryExpr): void {
  switch (expr.op.type) {
    case "BANG":
      write(ctx, "!");
      break;
    case "MINUS":
      write(ctx, "-");
      break;
  }

  generateExpr(ctx, expr.right);
}

function generateGroupingExpr(ctx: GeneratorContext, expr: GroupingExpr): void {
  write(ctx, "(");
  generateExpr(ctx, expr.expr);
  write(ctx, ")");
}

function generateVariableExpr(ctx: GeneratorContext, expr: VariableExpr): void {
  write(ctx, expr.name.lexeme);
}

function generateLiteralExpr(ctx: GeneratorContext, expr: LiteralExpr): void {
  switch (typeof expr.value) {
    case "number":
      write(ctx, expr.value.toString());
      break;
    case "string":
      write(ctx, JSON.stringify(expr.value));
      break;
    case "boolean":
      write(ctx, expr.value ? "true" : "false");
      break;
  }
}

// -------------------
//  Generator Context
// -------------------

const SPACING = "  ";
type GeneratorContext = {
  indent: number;
  output: string;
};

function createGeneratorContext(): GeneratorContext {
  return {
    indent: 0,
    output: "",
  };
}

function indent(ctx: GeneratorContext): void {
  ctx.indent += 1;
}

function outdent(ctx: GeneratorContext): void {
  ctx.indent -= 1;
}

function write(ctx: GeneratorContext, str: string, indent = false): void {
  if (indent) {
    ctx.output += SPACING.repeat(ctx.indent);
  }
  ctx.output += str;
}

function writeln(ctx: GeneratorContext, str: string): void {
  write(ctx, SPACING.repeat(ctx.indent) + str + "\n");
}
