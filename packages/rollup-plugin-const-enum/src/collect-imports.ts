import ts from 'typescript';

export function collectImportBindings(sourceFile: ts.SourceFile): ReadonlySet<string> {
  const bindings = new Set<string>();

  for (let i = 0; i < sourceFile.statements.length; i++) {
    const statement = sourceFile.statements[i];
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const importClause = statement.importClause;
    if (!importClause) {
      continue;
    }

    if (importClause.name) {
      bindings.add(importClause.name.text);
    }

    const namedBindings = importClause.namedBindings;
    if (!namedBindings) {
      continue;
    }

    if (ts.isNamespaceImport(namedBindings)) {
      bindings.add(namedBindings.name.text);
      continue;
    }

    for (let j = 0; j < namedBindings.elements.length; j++) {
      bindings.add(namedBindings.elements[j].name.text);
    }
  }

  return bindings;
}

export function getLeftmostIdentifier(expression: ts.Expression): ts.Identifier | undefined {
  let current: ts.Expression = expression;

  while (true) {
    if (ts.isIdentifier(current)) {
      return current;
    }

    if (ts.isPropertyAccessExpression(current)) {
      current = current.expression;
      continue;
    }

    if (ts.isElementAccessExpression(current)) {
      current = current.expression;
      continue;
    }

    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
      continue;
    }

    if (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isNonNullExpression(current)) {
      current = current.expression;
      continue;
    }

    return undefined;
  }
}
