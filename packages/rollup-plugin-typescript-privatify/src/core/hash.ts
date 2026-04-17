import ts from 'typescript';
import type { ClassLikeNode } from '../types/global.js';
import {
  ACCESSIBILITY_KINDS,
  collectPrivateNames,
  filterModifiers,
  getMemberIdentifierName,
  getNodeModifiers,
  hasModifier,
  isConvertiblePrivateMember,
  isThisExpression,
  updateClassNode,
} from './class-utils.js';

export function transformClassToHash(
  node: ClassLikeNode,
  context: ts.TransformationContext
): ClassLikeNode {
  const names = collectPrivateNames(node);
  if (names.instanceNames.size === 0 && names.staticNames.size === 0) {
    return node;
  }

  const renameMaps = createHashRenameMaps(node);

  const members = node.members.map((member) => {
    const inStaticContext = hasModifier(member, ts.SyntaxKind.StaticKeyword);
    const scopeNames = inStaticContext ? renameMaps.staticMap : renameMaps.instanceMap;
    let nextMember = rewriteHashReferences(member, scopeNames, context);

    if (isConvertiblePrivateMember(nextMember)) {
      nextMember = renamePrivateMemberToHash(nextMember, context.factory, scopeNames);
    }

    return nextMember;
  });

  return updateClassNode(node, members, context.factory);
}

export function rewriteHashReferences<T extends ts.Node>(
  node: T,
  privateNames: Set<string> | Map<string, string>,
  context: ts.TransformationContext
): T {
  if (privateNames.size === 0) {
    return node;
  }

  const factory = context.factory;
  const visit: ts.Visitor = (current) => {
    if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) {
      return current;
    }

    if (
      ts.isPropertyAccessExpression(current) &&
      isThisExpression(current.expression) &&
      hasHashMapping(current.name.text, privateNames)
    ) {
      const mapped = getHashMapping(current.name.text, privateNames);
      if (!mapped) {
        return current;
      }

      return factory.createPropertyAccessExpression(
        current.expression,
        factory.createPrivateIdentifier(mapped)
      );
    }

    return ts.visitEachChild(current, visit, context);
  };

  return ts.visitNode(node, visit) as T;
}

export function renamePrivateMemberToHash(
  member: ts.ClassElement,
  factory: ts.NodeFactory,
  privateNames?: Set<string> | Map<string, string>
): ts.ClassElement {
  if (!isConvertiblePrivateMember(member)) {
    return member;
  }

  const name = getMemberIdentifierName(member);
  if (!name) {
    return member;
  }

  const mapped = privateNames ? getHashMapping(name, privateNames) : undefined;
  const hashName = factory.createPrivateIdentifier(mapped ?? `#${name}`);
  const modifiers = filterModifiers(getNodeModifiers(member), ACCESSIBILITY_KINDS);

  if (ts.isPropertyDeclaration(member)) {
    return factory.updatePropertyDeclaration(
      member,
      modifiers,
      hashName,
      member.questionToken,
      member.type,
      member.initializer
    );
  }

  if (ts.isMethodDeclaration(member)) {
    return factory.updateMethodDeclaration(
      member,
      modifiers,
      member.asteriskToken,
      hashName,
      member.questionToken,
      member.typeParameters,
      member.parameters,
      member.type,
      member.body
    );
  }

  if (ts.isGetAccessorDeclaration(member)) {
    return factory.updateGetAccessorDeclaration(
      member,
      modifiers,
      hashName,
      member.parameters,
      member.type,
      member.body
    );
  }

  if (ts.isSetAccessorDeclaration(member)) {
    return factory.updateSetAccessorDeclaration(member, modifiers, hashName, member.parameters, member.body);
  }

  return member;
}

function createHashRenameMaps(node: ClassLikeNode): {
  instanceMap: Map<string, string>;
  staticMap: Map<string, string>;
} {
  const usedHashNames = collectExistingHashNames(node);
  const instanceMap = new Map<string, string>();
  const staticMap = new Map<string, string>();

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (!isConvertiblePrivateMember(member)) {
      continue;
    }

    const name = getMemberIdentifierName(member);
    if (!name) {
      continue;
    }

    const targetMap = hasModifier(member, ts.SyntaxKind.StaticKeyword) ? staticMap : instanceMap;
    if (targetMap.has(name)) {
      continue;
    }

    const mapped = createUniqueHashName(name, usedHashNames);
    targetMap.set(name, mapped);
    usedHashNames.add(mapped);
  }

  return { instanceMap, staticMap };
}

function collectExistingHashNames(node: ClassLikeNode): Set<string> {
  const names = new Set<string>();

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (!('name' in member)) {
      continue;
    }

    const nameNode = member.name;
    if (nameNode && ts.isPrivateIdentifier(nameNode)) {
      names.add(nameNode.text);
    }
  }

  return names;
}

function createUniqueHashName(name: string, usedNames: Set<string>): string {
  const preferred = `#${name}`;
  if (!usedNames.has(preferred)) {
    return preferred;
  }

  let index = 1;
  let candidate = `${preferred}_${index}`;
  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${preferred}_${index}`;
  }

  return candidate;
}

function hasHashMapping(name: string, privateNames: Set<string> | Map<string, string>): boolean {
  if (privateNames instanceof Map) {
    return privateNames.has(name);
  }
  return privateNames.has(name);
}

function getHashMapping(name: string, privateNames: Set<string> | Map<string, string>): string | undefined {
  if (privateNames instanceof Map) {
    return privateNames.get(name);
  }

  return privateNames.has(name) ? `#${name}` : undefined;
}
