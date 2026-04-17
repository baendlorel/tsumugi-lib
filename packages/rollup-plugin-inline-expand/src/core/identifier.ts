import type * as acorn from 'acorn';

export function isReferenceIdentifier(node: acorn.Identifier, parent: acorn.AnyNode | undefined): boolean {
  if (!parent) {
    return true;
  }

  if (parent.type === 'MemberExpression') {
    if (parent.property === node && !parent.computed) {
      return false;
    }
    return true;
  }

  if (parent.type === 'Property') {
    if (parent.key === node) {
      if (parent.shorthand) {
        return true;
      }
      return !!parent.computed;
    }
    return true;
  }

  if (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') {
    if (parent.key === node && !parent.computed) {
      return false;
    }
    return true;
  }

  if (parent.type === 'VariableDeclarator' && parent.id === node) {
    return false;
  }

  if (parent.type === 'AssignmentPattern' && parent.left === node) {
    return false;
  }

  if (parent.type === 'RestElement' && parent.argument === node) {
    return false;
  }

  if (parent.type === 'ArrayPattern' || parent.type === 'ObjectPattern') {
    return false;
  }

  if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') && parent.id === node) {
    return false;
  }

  if (
    parent.type === 'ImportSpecifier' ||
    parent.type === 'ImportDefaultSpecifier' ||
    parent.type === 'ImportNamespaceSpecifier'
  ) {
    return false;
  }

  if (parent.type === 'CatchClause' && parent.param === node) {
    return false;
  }

  if (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') {
    return false;
  }

  return true;
}
