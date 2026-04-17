import ts from 'typescript';
import type { ClassLikeNode, CompanionMember, PrivateNameSets } from '../types/global.js';

export const ACCESSIBILITY_KINDS = [
  ts.SyntaxKind.PrivateKeyword,
  ts.SyntaxKind.ProtectedKeyword,
  ts.SyntaxKind.PublicKeyword,
] as const;

export function collectPrivateNames(node: ClassLikeNode): PrivateNameSets {
  const instanceNames = new Set<string>();
  const instanceMethods = new Set<string>();
  const staticNames = new Set<string>();

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (!isConvertiblePrivateMember(member)) {
      continue;
    }

    const name = getMemberIdentifierName(member);
    if (!name) {
      continue;
    }

    if (hasModifier(member, ts.SyntaxKind.StaticKeyword)) {
      staticNames.add(name);
      continue;
    }

    instanceNames.add(name);
    if (ts.isMethodDeclaration(member)) {
      instanceMethods.add(name);
    }
  }

  return { instanceNames, instanceMethods, staticNames };
}

export function collectCompanionMembers(node: ts.ClassDeclaration): CompanionMember[] {
  const members: CompanionMember[] = [];

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (!isMovedToCompanion(member)) {
      continue;
    }

    const name = getMemberIdentifierName(member);
    if (!name) {
      continue;
    }

    if (ts.isPropertyDeclaration(member)) {
      members.push({ kind: 'property', node: member, name });
      continue;
    }

    if (ts.isMethodDeclaration(member)) {
      members.push({ kind: 'method', node: member, name });
      continue;
    }

    if (ts.isGetAccessorDeclaration(member)) {
      members.push({ kind: 'getter', node: member, name });
      continue;
    }

    if (ts.isSetAccessorDeclaration(member)) {
      members.push({ kind: 'setter', node: member, name });
    }
  }

  return members;
}

export function filterModifiers(
  modifiers: ts.NodeArray<ts.ModifierLike> | undefined,
  blockList: readonly ts.SyntaxKind[]
): ts.NodeArray<ts.ModifierLike> | undefined {
  if (!modifiers || modifiers.length === 0) {
    return undefined;
  }

  const blocked = new Set<number>(blockList);
  const kept = modifiers.filter((modifier) => !blocked.has(modifier.kind));
  return kept.length > 0 ? ts.factory.createNodeArray(kept) : undefined;
}

export function isConvertiblePrivateMember(member: ts.ClassElement): boolean {
  return hasIdentifierMemberName(member) && hasModifier(member, ts.SyntaxKind.PrivateKeyword);
}

export function isMovedToCompanion(member: ts.ClassElement): boolean {
  if (!isConvertiblePrivateMember(member)) {
    return false;
  }

  if (hasModifier(member, ts.SyntaxKind.StaticKeyword)) {
    return false;
  }

  return (
    ts.isPropertyDeclaration(member) ||
    ts.isMethodDeclaration(member) ||
    ts.isGetAccessorDeclaration(member) ||
    ts.isSetAccessorDeclaration(member)
  );
}

export function getMemberIdentifierName(member: ts.ClassElement): string | undefined {
  if (!hasIdentifierMemberName(member)) {
    return undefined;
  }

  return member.name.text;
}

export function getNodeModifiers(node: ts.Node): ts.NodeArray<ts.ModifierLike> | undefined {
  return (node as ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
}

export function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers = getNodeModifiers(node);
  return Boolean(modifiers?.some((modifier) => modifier.kind === kind));
}

export function hasExtendsClause(node: ts.ClassDeclaration): boolean {
  if (!node.heritageClauses) {
    return false;
  }

  for (let i = 0; i < node.heritageClauses.length; i++) {
    if (node.heritageClauses[i].token === ts.SyntaxKind.ExtendsKeyword) {
      return true;
    }
  }

  return false;
}

export function updateClassNode<T extends ClassLikeNode>(
  node: T,
  members: ts.ClassElement[],
  factory: ts.NodeFactory
): T {
  if (ts.isClassDeclaration(node)) {
    return factory.updateClassDeclaration(
      node,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      members
    ) as T;
  }

  return factory.updateClassExpression(
    node,
    node.modifiers,
    node.name,
    node.typeParameters,
    node.heritageClauses,
    members
  ) as T;
}

export function isThisExpression(node: ts.Node): node is ts.ThisExpression {
  return node.kind === ts.SyntaxKind.ThisKeyword;
}

function hasIdentifierMemberName(
  member: ts.ClassElement
): member is ts.ClassElement & { name: ts.Identifier } {
  if (!('name' in member)) {
    return false;
  }

  const nodeName = member.name;
  return Boolean(nodeName && ts.isIdentifier(nodeName));
}

