import type { CallSite, FunctionCandidate, ParameterReference } from './types.js';

export function expandAtCallSite(code: string, callSite: CallSite, candidate: FunctionCandidate): string {
  const argMap = new Map<string, string>();
  for (let i = 0; i < candidate.params.length; i++) {
    const param = candidate.params[i];
    const range = callSite.arguments[i];
    argMap.set(param, `(${code.slice(range.start, range.end)})`);
  }

  const expandedBody = applyParameterSubstitutions(
    candidate.sourceCode,
    candidate.expandStart,
    candidate.expandEnd,
    candidate.parameterReferences,
    argMap,
  );

  if (candidate.mode === 'expression') {
    return `(${expandedBody})`;
  }

  if (callSite.replacementKind === 'statement') {
    return expandedBody;
  }

  return expandedBody;
}

function applyParameterSubstitutions(
  code: string,
  start: number,
  end: number,
  refs: ParameterReference[],
  argMap: Map<string, string>,
): string {
  if (refs.length === 0) {
    return code.slice(start, end);
  }

  const chunks: string[] = [];
  let cursor = start;

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    if (ref.start < start || ref.end > end || ref.start < cursor) {
      continue;
    }

    chunks.push(code.slice(cursor, ref.start), argMap.get(ref.name) ?? code.slice(ref.start, ref.end));
    cursor = ref.end;
  }

  chunks.push(code.slice(cursor, end));
  return chunks.join('');
}
