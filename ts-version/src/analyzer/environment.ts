import { VarDecl, VariableExpr } from "../ast/types.ts";

export type Environment = {
  scopes: Scope[];
};

export type Scope = {
  variables: Record<string, Variable>;
};

export type Variable = {
  isConst: boolean;
  declaration: VarDecl;
  references: VariableExpr[];
};

export function createEnvironment(): Environment {
  return {
    scopes: [{
      variables: {},
    }],
  };
}

export function enterScope(env: Environment): void {
  env.scopes.unshift({
    variables: {},
  });
}

export function exitScope(env: Environment): void {
  env.scopes.shift();
}

export function addVariable(
  env: Environment,
  declaration: VarDecl,
): boolean {
  const name = declaration.name.lexeme;
  if (env.scopes[0].variables[name]) {
    return false;
  }

  env.scopes[0].variables[name] = {
    isConst: declaration.isConst,
    declaration,
    references: [],
  };
  return true;
}

export function addReference(
  env: Environment,
  name: string,
  reference: VariableExpr,
): boolean {
  const variable = env.scopes[0].variables[name];
  if (!variable) {
    return false;
  }
  variable.references.push(reference);
  return true;
}

export function getVariable(env: Environment, name: string): Variable | null {
  for (const scope of env.scopes) {
    if (scope.variables[name]) {
      return scope.variables[name];
    }
  }
  return null;
}

/**
 * Returns all the variables that are not used in the current scope.
 * @param env - The environment to analyze.
 * @returns An array of unused variables.
 */
export function getUnusedVariables(env: Environment): Variable[] {
  return Object.values(env.scopes[0].variables).filter(
    (variable) => variable.references.length === 0,
  );
}
