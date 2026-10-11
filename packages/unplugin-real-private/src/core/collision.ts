import ts from 'typescript';
import { type ClassLikeNode, getDeclaredMemberName, getMemberName, isConvertibleMember } from './class-utils.js';

export interface Collision {
  /** The shared name, e.g. `x` for both `private x` and `#x`. */
  name: string;
  /** Start offset of the `private x` member that would become `#x`. */
  start: number;
}

/**
 * Every `#x` declared by the class, read straight from the source so that a
 * private name added by an earlier transform cannot slip through unnoticed.
 */
function collectHashNames(node: ClassLikeNode): Set<string> {
  const names = new Set<string>();

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (!('name' in member)) {
      continue;
    }

    const nameNode: ts.Node | undefined = member.name;
    if (nameNode && ts.isPrivateIdentifier(nameNode)) {
      names.add(stripHash(nameNode.text));
    }
  }

  return names;
}

/**
 * A `PrivateIdentifier` keeps the leading `#` in its text (`'#x'`), while class
 * member names are plain (`'x'`).
 */
function stripHash(name: string): string {
  return name.startsWith('#') ? name.slice(1) : name;
}

/**
 * Finds every `private x` that already has a sibling `#x`.
 *
 * JavaScript allows a single declaration of a given private name per class
 * (accessors aside), and a converted `#x = ...` member would additionally
 * override whatever `#x` holds today. Both make the conversion ambiguous, so
 * the caller stops and lets the user decide.
 */
export function findHashCollisions(node: ClassLikeNode): Collision[] {
  const hashNames = collectHashNames(node);
  if (hashNames.size === 0) {
    return [];
  }

  const collisions: Collision[] = [];

  for (let i = 0; i < node.members.length; i++) {
    const member = node.members[i];
    if (!isConvertibleMember(member)) {
      continue;
    }

    const name = getMemberName(member);
    if (name && hashNames.has(name)) {
      collisions.push({ name, start: member.getStart() });
    }
  }

  return collisions;
}

/** Compact `A` / `A#a,#b` summary of a class, for error messages. */
export function describeClass(node: ClassLikeNode): string {
  const names: string[] = [];

  for (let i = 0; i < node.members.length; i++) {
    const name = getDeclaredMemberName(node.members[i]);
    if (name) {
      names.push(name);
    }
  }

  const className = node.name?.text ?? '<anonymous class>';
  return names.length > 0 ? `${className}#${names.join(',')}` : className;
}
