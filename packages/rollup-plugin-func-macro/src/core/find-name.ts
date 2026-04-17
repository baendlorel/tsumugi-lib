import type {
  Node,
  AnonymousFunctionDeclaration,
  FunctionDeclaration,
  MethodDefinition,
  FunctionExpression,
} from 'acorn';
import { simple } from 'acorn-walk';

import type { FunctionContext, FunctionNode } from '../types/private.js';
import { between, Consts } from '../common.js';

interface InvalidRange {
  start: number;
  end: number;
}

interface CachedContexts {
  funcs: FunctionContext[];
  invalidRanges: InvalidRange[];
}

const contextCache = new WeakMap<Node, CachedContexts>();

/**
 * Find function name at a specific position in the code
 *
 * @param code raw js code
 * @param ast abstract syntax tree
 * @param position position of the identifier, used for finding the closest function name and checking the invalid usage in method name
 * @param fallback if cannot find a name, use this fallback
 * @returns function name
 */
export function findFunctionNameAtPosition(code: string, ast: Node, position: number, fallback: string): string {
  const context = getCachedContexts(code, ast);
  for (let i = 0; i < context.invalidRanges.length; i++) {
    const range = context.invalidRanges[i];
    if (between(position, range.start, range.end)) {
      return Consts.InvalidUsingMacroInMethodName;
    }
  }

  return findClosestName(context.funcs, position, fallback);
}

function getCachedContexts(code: string, ast: Node): CachedContexts {
  const cached = contextCache.get(ast);
  if (cached) {
    return cached;
  }

  const funcs: FunctionContext[] = [];
  const add = (node: FunctionNode, name: string) =>
    funcs.push({
      name,
      start: node.start,
      end: node.end,
    });

  simple(ast, {
    FunctionDeclaration(node: FunctionDeclaration | AnonymousFunctionDeclaration) {
      add(node, node.id?.name ?? Consts.AnonymousFunction);
    },

    FunctionExpression(node: FunctionExpression) {
      add(node, node.id?.name ?? Consts.AnonymousFunctionExpression);
    },

    MethodDefinition(node: MethodDefinition) {
      const key = node.key;
      let name: string = Consts.AnonymousMethod;

      if (key.type === 'Identifier') {
        // Regular method: methodName() {}
        name = key.name;
      } else if (key.type === 'Literal') {
        // Dynamic method: ['methodName']() {} or ["methodName"]() {}
        name = String(key.value);
      } else {
        // Other dynamic method: ['dynamicMethod'+ getName() + "asdf"]() {}
        name = code.substring(key.start, key.end);
      }
      add(node, name);
    },
  });

  const normalized = normalizeContexts(funcs);
  contextCache.set(ast, normalized);
  return normalized;
}

function normalizeContexts(funcs: FunctionContext[]): CachedContexts {
  const groupedByEnd = new Map<number, FunctionContext[]>();
  for (let i = 0; i < funcs.length; i++) {
    const func = funcs[i];
    const group = groupedByEnd.get(func.end);
    if (!group) {
      groupedByEnd.set(func.end, [func]);
      continue;
    }
    group.push(func);
  }

  const filtered: FunctionContext[] = [];
  const invalidRanges: InvalidRange[] = [];
  for (const sameEndFuncs of groupedByEnd.values()) {
    if (sameEndFuncs.length === 1) {
      filtered.push(sameEndFuncs[0]);
      continue;
    }

    let current = sameEndFuncs[0];
    let minStart = current.start;
    let maxStart = current.start;

    for (let i = 1; i < sameEndFuncs.length; i++) {
      const func = sameEndFuncs[i];
      if (current.start >= func.start) {
        current = func;
      }
      if (func.start < minStart) {
        minStart = func.start;
      }
      if (maxStart < func.start) {
        maxStart = func.start;
      }
    }

    filtered.push(current);
    if (minStart !== maxStart) {
      invalidRanges.push({
        start: minStart,
        end: maxStart,
      });
    }
  }

  return {
    funcs: filtered,
    invalidRanges,
  };
}

function findClosestName(funcs: FunctionContext[], position: number, fallback: string): string {
  // Find the innermost function that contains the position
  // Skip arrow functions by only considering our collected contexts
  // & Find the closest function name
  let name = fallback;
  let maxStart = -1;
  for (let i = 0; i < funcs.length; i++) {
    const func = funcs[i];
    if (position < func.start || func.end < position) {
      continue;
    }

    // Better to be greater than maxStart
    if (func.start > maxStart) {
      name = func.name;
      maxStart = func.start;
    }
  }
  return name;
}
