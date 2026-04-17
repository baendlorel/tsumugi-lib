import MagicString from 'magic-string';
import type { ExistingRawSourceMap } from 'rollup';
import type { IfNode, IfStatement } from '../types/if.js';

interface TransformOptions {
  filename?: string;
}

export interface TransformResult {
  code: string;
  map: ExistingRawSourceMap;
}

interface BranchState {
  start: number;
  end: number;
  condition: string | null;
  nested: IfNode[];
}

type ConditionEvaluator = (condition: string) => boolean;

export function apply(
  code: string,
  nodes: IfNode[],
  values: Record<string, unknown>,
  options: TransformOptions = {},
): TransformResult {
  const MagicStringCtor = MagicString as unknown as typeof import('magic-string').default;
  const magicString = new MagicStringCtor(code, { filename: options.filename });
  const rangesToDrop: Array<{ start: number; end: number }> = [];
  const evaluateCondition = createEvaluator(values);

  for (let i = 0; i < nodes.length; i++) {
    collectDrops(nodes[i], evaluateCondition, rangesToDrop);
  }

  const merged = mergeRanges(rangesToDrop);
  for (let i = merged.length - 1; i >= 0; i--) {
    const range = merged[i];
    magicString.remove(range.start, range.end);
  }

  const filename = options.filename ?? 'source.js';
  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      file: filename,
      source: filename,
      includeContent: true,
      hires: true,
    }) as unknown as ExistingRawSourceMap,
  };
}

function collectDrops(
  node: IfNode,
  evaluateCondition: ConditionEvaluator,
  ranges: Array<{ start: number; end: number }>,
) {
  const ifLineStart = toIndexStart(node.start);
  const ifLineEnd = node.end;
  const endIfLineStart = toIndexStart(node.endIf.start);
  const endIfLineEnd = node.endIf.end;

  pushRange(ranges, ifLineStart, ifLineEnd);
  for (let i = 0; i < node.elseIfs.length; i++) {
    pushRange(ranges, toIndexStart(node.elseIfs[i].start), node.elseIfs[i].end);
  }
  if (node.else) {
    pushRange(ranges, toIndexStart(node.else.start), node.else.end);
  }
  pushRange(ranges, endIfLineStart, endIfLineEnd);

  const branches = toBranches(node, endIfLineStart);

  let chosenIndex = -1;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    if (branch.condition === null) {
      chosenIndex = i;
      break;
    }

    if (evaluateCondition(branch.condition)) {
      chosenIndex = i;
      break;
    }
  }

  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    if (i !== chosenIndex) {
      pushRange(ranges, branch.start, branch.end);
      continue;
    }

    for (let j = 0; j < branch.nested.length; j++) {
      collectDrops(branch.nested[j], evaluateCondition, ranges);
    }
  }
}

function toBranches(node: IfNode, endIfLineStart: number): BranchState[] {
  const starts: number[] = [];
  const ends: number[] = [];
  const conditions: Array<string | null> = [];
  const nestedNodes: IfNode[][] = [];

  starts.push(node.end);
  ends.push(0);
  conditions.push(node.condition);
  nestedNodes.push(onlyIfNodes(node.body));

  for (let i = 0; i < node.elseIfs.length; i++) {
    const item = node.elseIfs[i];
    starts.push(item.end);
    ends.push(0);
    conditions.push(item.condition);
    nestedNodes.push(onlyIfNodes(item.body));
  }

  if (node.else) {
    starts.push(node.else.end);
    ends.push(0);
    conditions.push(null);
    nestedNodes.push(onlyIfNodes(node.else.body));
  }

  const controls = [node, ...node.elseIfs, ...(node.else ? [node.else] : [])];
  for (let i = 0; i < controls.length; i++) {
    const next = controls[i + 1];
    ends[i] = next ? toIndexStart(next.start) : endIfLineStart;
  }

  const branches: BranchState[] = [];
  for (let i = 0; i < starts.length; i++) {
    branches.push({
      start: starts[i],
      end: ends[i],
      condition: conditions[i],
      nested: nestedNodes[i],
    });
  }
  return branches;
}

function onlyIfNodes(statements: IfStatement[]): IfNode[] {
  const result: IfNode[] = [];
  for (let i = 0; i < statements.length; i++) {
    const item = statements[i];
    if (item.type === 'if') {
      result.push(item);
    }
  }
  return result;
}

function pushRange(ranges: Array<{ start: number; end: number }>, start: number, end: number) {
  if (start < end) {
    ranges.push({ start, end });
  }
}

function toIndexStart(position: number): number {
  return Math.max(0, position - 1);
}

function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (ranges.length <= 1) {
    return ranges;
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Array<{ start: number; end: number }> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push({ start: current.start, end: current.end });
  }

  return merged;
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function createEvaluator(variables: Record<string, unknown>): ConditionEvaluator {
  const entries = Object.entries(variables);
  const names: string[] = [];
  const values: unknown[] = [];

  for (let i = 0; i < entries.length; i++) {
    const [name, value] = entries[i];
    if (!IDENTIFIER.test(name)) {
      throw new SyntaxError(`Invalid variable name '${name}', expected a valid JavaScript identifier.`);
    }
    names.push(name);
    values.push(value);
  }

  if (names.length === 0) {
    return (condition) => {
      const fn = new Function(`return (${condition});`);
      return Boolean(fn());
    };
  }

  return (condition) => {
    const fn = new Function(...names, `return (${condition});`);
    return Boolean(fn(...values));
  };
}
