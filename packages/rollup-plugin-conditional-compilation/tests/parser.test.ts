import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { loadjs } from './setup.js';

describe('core parse behavior', () => {
  it('returns an empty array when no directives are present', () => {
    expect(parse(loadjs('case3.js'))).toEqual([]);
  });

  it('builds sibling and nested if trees for case5', () => {
    const nodes = parse(loadjs('case5.js'));

    expect(nodes).toHaveLength(2);
    expect(nodes[0].condition.trim()).toBe('B');
    expect(nodes[1].condition.trim()).toBe('2+3');

    const firstNested = nodes[0].body.filter((item) => item.type === 'if');
    const secondNested = nodes[1].body.filter((item) => item.type === 'if');
    expect(firstNested).toHaveLength(2);
    expect(secondNested).toHaveLength(1);
  });

  it('links elseif/else/endif nodes back to their owner if node', () => {
    const [topA, topX] = parse(loadjs('case10.js'));

    expect(topA.elseIfs.length).toBe(2);
    expect(topA.elseIfs.every((item) => item.belong === topA)).toBe(true);
    expect(topA.else?.belong).toBe(topA);
    expect(topA.endIf.belong).toBe(topA);

    const nested = topX.body.find((item) => item.type === 'if');
    expect(nested?.type).toBe('if');
    if (nested?.type === 'if') {
      expect(nested.elseIfs).toHaveLength(1);
      expect(nested.elseIfs[0].belong).toBe(nested);
      expect(nested.else?.belong).toBe(nested);
      expect(nested.endIf.belong).toBe(nested);
    }
  });

  it('throws on malformed directive order', () => {
    expect(() => parse(loadjs('case15.js'))).toThrow(/Must start with #if, got #elseif/);
    expect(() => parse(loadjs('case17.js'))).toThrow(/Unexpected #else statement found after #else/);
  });

  it('throws on orphan endif and unclosed blocks', () => {
    const orphanEndIf = `// #if A\nkeep();\n// #endif\n// #endif\n`;
    const unclosedOuter = `// #if A\n// #if B\nkeep();\n// #endif\n`;

    expect(() => parse(orphanEndIf)).toThrow(/Unexpected #endif statement found/);
    expect(() => parse(unclosedOuter)).toThrow(/Unclosed #if statement found/);
  });

  it('throws when #elif alias is used', () => {
    const code = `// #if true\nkeep();\n// #elif false\ndrop();\n// #endif\n`;
    expect(() => parse(code)).toThrow(/#elif is no longer supported/);
  });
});
