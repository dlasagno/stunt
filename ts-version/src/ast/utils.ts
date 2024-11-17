import type { AST } from "./types.ts";
import { visitAllASTWithCtx } from "./visit.ts";

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
    pfx = prefix.slice(0, -1) + (last ? "└" : "├");
  }
  console.log(`${pfx}─${str}`, ...colors);
}

function fmtPrefix(prefix: string, last = true): string {
  if (!last || prefix.length < 2) return prefix + SPACES;
  return prefix.slice(0, -2) + "  " + SPACES;
}

export function printAST(ast: AST) {
  visitAllASTWithCtx<{
    prefix: string;
    lastChild?: AST;
  }>(
    ast,
    { prefix: "" },
    {
      visitProgram(program, { prefix, lastChild }) {
        const last = program === lastChild;
        printEntry(prefix, last, ["program", "cyan"]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: program.stmts.at(-1),
        };
      },
      visitVarDecl(decl, { prefix, lastChild }) {
        const last = decl === lastChild;
        printEntry(
          prefix,
          last,
          ["varDecl", "cyan"],
          [decl.isConst ? "CONST" : "LET"],
          [decl.name.lexeme, "magenta"],
        );
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: decl.initializer,
        };
      },
      visitExprStmt(stmt, { prefix, lastChild }) {
        const last = stmt === lastChild;
        printEntry(prefix, last, ["exprStmt", "cyan"]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: stmt.expr,
        };
      },
      visitAssignment(stmt, { prefix, lastChild }) {
        const last = stmt === lastChild;
        printEntry(prefix, last, ["assignment", "cyan"], [
          stmt.name.lexeme,
          "magenta",
        ]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: stmt.expression,
        };
      },
      visitBlockStmt(stmt, { prefix, lastChild }) {
        const last = stmt === lastChild;
        printEntry(prefix, last, ["blockStmt", "cyan"]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: stmt.block,
        };
      },
      visitBlock(block, { prefix, lastChild }) {
        const last = block === lastChild;
        printEntry(prefix, last, ["block", "cyan"]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: block.stmts.at(-1),
        };
      },
      visitIfStmt(stmt, { prefix, lastChild }) {
        const last = stmt === lastChild;
        printEntry(prefix, last, ["ifStmt", "cyan"]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: stmt.elseBranch,
        };
      },
      visitBinaryExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(prefix, last, ["binaryExpr", "cyan"], [expr.op.type]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: expr.right,
        };
      },
      visitUnaryExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(prefix, last, ["unaryExpr", "cyan"], [expr.op.type]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: expr.right,
        };
      },
      visitGroupingExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(prefix, last, ["groupingExpr", "cyan"]);
        return {
          prefix: fmtPrefix(prefix, last),
          lastChild: expr.expr,
        };
      },
      visitNumberLiteralExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(
          prefix,
          last,
          ["numberLiteralExpr", "cyan"],
          [expr.value.toString(), "yellow"],
        );
        return { prefix: fmtPrefix(prefix, last) };
      },
      visitStringLiteralExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(
          prefix,
          last,
          ["stringLiteralExpr", "cyan"],
          [JSON.stringify(expr.value), "yellow"],
        );
        return { prefix: fmtPrefix(prefix, last) };
      },
      visitBooleanLiteralExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(
          prefix,
          last,
          ["booleanLiteralExpr", "cyan"],
          [expr.value ? "true" : "false", "yellow"],
        );
        return { prefix: fmtPrefix(prefix, last) };
      },
      visitVariableExpr(expr, { prefix, lastChild }) {
        const last = expr === lastChild;
        printEntry(prefix, last, ["variableExpr", "cyan"], [
          expr.name.lexeme,
          "magenta",
        ]);
        return {
          prefix: fmtPrefix(prefix, last),
        };
      },
    },
  );
}
