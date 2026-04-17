import { ancestor } from 'acorn-walk';
import type * as acorn from 'acorn';
import { isReferenceIdentifier } from './identifier.js';
import type { CallSite, FunctionCandidate, SourceRange } from './types.js';

export function collectRemovableCandidates(
  ast: acorn.Program,
  candidates: Map<string, FunctionCandidate>,
  callSites: CallSite[],
): Set<string> {
  const callSiteCounts = new Map<string, number>();
  const callSiteLookup = new Set<string>();

  for (let i = 0; i < callSites.length; i++) {
    const callSite = callSites[i];
    callSiteCounts.set(callSite.name, (callSiteCounts.get(callSite.name) ?? 0) + 1);
    callSiteLookup.add(toCallSiteLookupKey(callSite.name, callSite.start, callSite.end));
  }

  const blocked = new Set<string>();

  ancestor(ast, {
    Identifier(node: acorn.Identifier, _state: unknown, ancestors: acorn.Node[]) {
      const name = node.name as string;
      const candidate = candidates.get(name);
      if (!candidate) {
        return;
      }

      const parent = ancestors[ancestors.length - 2] as acorn.AnyNode | undefined;
      if (!isReferenceIdentifier(node, parent)) {
        return;
      }

      if (
        candidate.declarationStart !== undefined &&
        candidate.declarationEnd !== undefined &&
        isRangeInside(node.start, node.end, { start: candidate.declarationStart, end: candidate.declarationEnd })
      ) {
        return;
      }

      if (
        parent?.type === 'CallExpression' &&
        parent.callee === node &&
        callSiteLookup.has(toCallSiteLookupKey(name, parent.start, parent.end))
      ) {
        return;
      }

      blocked.add(name);
    },
  });

  const removable = new Set<string>();
  for (const [name, candidate] of candidates.entries()) {
    if (candidate.declarationStart === undefined || candidate.declarationEnd === undefined) {
      continue;
    }

    if (blocked.has(name)) {
      continue;
    }

    if ((callSiteCounts.get(name) ?? 0) === 0) {
      continue;
    }

    removable.add(name);
  }

  return removable;
}

export function toRemovalRanges(candidates: Map<string, FunctionCandidate>, removable: Set<string>): SourceRange[] {
  const ranges: SourceRange[] = [];

  for (const name of removable) {
    const candidate = candidates.get(name);
    if (!candidate || candidate.declarationStart === undefined || candidate.declarationEnd === undefined) {
      continue;
    }

    ranges.push({ start: candidate.declarationStart, end: candidate.declarationEnd });
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

export function isRangeInsideAny(start: number, end: number, ranges: SourceRange[]): boolean {
  for (let i = 0; i < ranges.length; i++) {
    if (isRangeInside(start, end, ranges[i])) {
      return true;
    }
  }

  return false;
}

function toCallSiteLookupKey(name: string, start: number, end: number): string {
  return `${name}:${start}:${end}`;
}

function isRangeInside(start: number, end: number, outerRange: SourceRange): boolean {
  return start >= outerRange.start && end <= outerRange.end;
}
