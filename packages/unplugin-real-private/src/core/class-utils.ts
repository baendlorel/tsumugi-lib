import ts from 'typescript';

export type ClassLikeNode = ts.ClassDeclaration | ts.ClassExpression;

/** Visibility modifiers that stop making sense once a member is `#private`. */
export const ACCESSIBILITY_MODIFIERS: readonly ts.SyntaxKind[] = [
  ts.SyntaxKind.PrivateKeyword,
  ts.SyntaxKind.ProtectedKeyword,
  ts.SyntaxKind.PublicKeyword,
];

export function getModifiers(node: ts.Node): ts.NodeArray<ts.ModifierLike> | undefined {
  return (node as ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
}

export function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers = getModifiers(node);
  if (!modifiers) {
    return false;
  }

  for (let i = 0; i < modifiers.length; i++) {
    if (modifiers[i].kind === kind) {
      return true;
    }
  }

  return false;
}

export function isStatic(member: ts.ClassElement): boolean {
  return hasModifier(member, ts.SyntaxKind.StaticKeyword);
}

/**
 * Members whose name is a plain identifier, e.g. `private foo` / `private foo()`.
 * String, numeric, and computed names are out of scope and left untouched.
 */
function hasConvertibleName(member: ts.ClassElement): member is ts.ClassElement & { name: ts.Identifier } {
  if (!('name' in member)) {
    return false;
  }

  return Boolean(member.name && ts.isIdentifier(member.name));
}

export function isPrivateMember(member: ts.ClassElement): boolean {
  return hasConvertibleName(member) && hasModifier(member, ts.SyntaxKind.PrivateKeyword);
}

/** The four member kinds the plugin knows how to rewrite. */
export function isConvertibleMember(member: ts.ClassElement): boolean {
  if (!isPrivateMember(member)) {
    return false;
  }

  return (
    ts.isPropertyDeclaration(member) ||
    ts.isMethodDeclaration(member) ||
    ts.isGetAccessorDeclaration(member) ||
    ts.isSetAccessorDeclaration(member)
  );
}

/** The member's name, for members whose name is a plain identifier. */
export function getMemberName(member: ts.ClassElement): string | undefined {
  return hasConvertibleName(member) ? member.name.text : undefined;
}

/** The member's name including `#x`, string, and numeric names. */
export function getDeclaredMemberName(member: ts.ClassElement): string | undefined {
  if (!('name' in member) || !member.name) {
    return undefined;
  }

  const name: ts.Node = member.name;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

/**
 * `constructor(private x: T)` is both a parameter and an instance member, so it
 * declares a private field of its own.
 *
 * Only `private` qualifies: a `public` / `protected` / plain `readonly`
 * parameter property stays reachable from outside (or from subclasses), so
 * turning it into a `#` name would change what the class exposes.
 */
export function isConstructorParameter(parameter: ts.ParameterDeclaration): parameter is ts.ParameterDeclaration & {
  name: ts.Identifier;
} {
  return (
    ts.isIdentifier(parameter.name) &&
    parameter.dotDotDotToken === undefined &&
    hasModifier(parameter, ts.SyntaxKind.PrivateKeyword)
  );
}
