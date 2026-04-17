import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';

interface IfLike {
  type: 'if';
  start: number;
  end: number;
  body: Array<{ type: string }>;
  elseIfs: Array<{ start: number; end: number; body: Array<{ type: string }> }>;
  else?: { start: number; end: number; body: Array<{ type: string }> };
  endIf: { start: number; end: number };
}

function directChildren(node: IfLike): IfLike[] {
  const result: IfLike[] = [];
  const collectFrom = (list: Array<{ type: string }>) => {
    for (const item of list) {
      if (item.type === 'if') {
        result.push(item as unknown as IfLike);
      }
    }
  };

  collectFrom(node.body);
  for (const branch of node.elseIfs) {
    collectFrom(branch.body);
  }
  if (node.else) {
    collectFrom(node.else.body);
  }

  return result;
}

function visit(nodes: IfLike[], callback: (node: IfLike) => void) {
  for (const node of nodes) {
    callback(node);
    visit(directChildren(node), callback);
  }
}

describe('if-node structural invariants', () => {
  it('keeps directive control lines in order within one if chain', () => {
    const nodes = parse(`// #if A\na();\n// #elseif B\nb();\n// #else\nc();\n// #endif\n`) as unknown as IfLike[];
    const node = nodes[0];

    const starts = [node.start, ...node.elseIfs.map((item) => item.start), node.else?.start ?? 0, node.endIf.start];
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]).toBeGreaterThan(starts[i - 1]);
    }
  });

  it('keeps nested if blocks inside the parent branch range', () => {
    const nodes = parse(`// #if OUTER\nouter();\n// #if INNER\ninner();\n// #endif\n// #elseif OUTER_ALT\nalt();\n// #endif\n`) as unknown as IfLike[];

    visit(nodes, (node) => {
      const children = directChildren(node);
      for (const child of children) {
        expect(child.start).toBeGreaterThan(node.end);
        expect(child.endIf.end).toBeLessThan(node.endIf.start);
      }
    });
  });
});
