import ts from 'typescript';

export function toLiteralText(value: string | number, node: ts.Expression): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  const raw = formatNumber(value);
  if (shouldWrapNumericLiteral(node)) {
    return `(${raw})`;
  }
  return raw;
}

function formatNumber(value: number) {
  if (Object.is(value, -0)) {
    return '-0';
  }
  return String(value);
}

function shouldWrapNumericLiteral(node: ts.Expression) {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
    return true;
  }

  if (ts.isElementAccessExpression(parent) && parent.expression === node) {
    return true;
  }

  if (ts.isCallExpression(parent) && parent.expression === node) {
    return true;
  }

  if (ts.isNewExpression(parent) && parent.expression === node) {
    return true;
  }

  if (ts.isTaggedTemplateExpression(parent) && parent.tag === node) {
    return true;
  }

  return false;
}
