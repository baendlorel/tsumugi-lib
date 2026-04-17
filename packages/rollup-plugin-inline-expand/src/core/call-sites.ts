import { ancestor } from 'acorn-walk';
import type * as acorn from 'acorn';
import type { CallSite, FunctionCandidate, SourceRange } from './types.js';

export function collectCallSites(ast: acorn.Program, candidates: Map<string, FunctionCandidate>): CallSite[] {
  const callSites: CallSite[] = [];

  ancestor(ast, {
    CallExpression(node: acorn.CallExpression, _state: unknown, ancestors: acorn.Node[]) {
      if (node.callee?.type !== 'Identifier' || node.optional) {
        return;
      }

      const candidate = candidates.get(node.callee.name);
      if (!candidate) {
        return;
      }

      const args = Array.isArray(node.arguments) ? node.arguments : [];
      if (args.length !== candidate.params.length) {
        return;
      }

      const ranges: SourceRange[] = [];
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg || arg.type === 'SpreadElement') {
          return;
        }
        ranges.push({ start: arg.start, end: arg.end });
      }

      const parent = ancestors[ancestors.length - 2] as acorn.AnyNode | undefined;
      const isStatementReplacement =
        candidate.mode === 'block' && parent?.type === 'ExpressionStatement' && parent.expression === node;

      callSites.push({
        name: node.callee.name as string,
        start: node.start,
        end: node.end,
        replaceStart: isStatementReplacement ? parent.start : node.start,
        replaceEnd: isStatementReplacement ? parent.end : node.end,
        replacementKind: isStatementReplacement ? 'statement' : 'expression',
        arguments: ranges,
      });
    },
  });

  return callSites;
}
