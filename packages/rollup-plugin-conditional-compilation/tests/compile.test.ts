import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { apply } from '../src/core/transform.js';
import { loadjs } from './setup.js';

function transformCase(name: `case${number}.js`, variables: Record<string, unknown>) {
  const code = loadjs(name);
  const nodes = parse(code);
  return apply(code, nodes, variables, { filename: name }).code;
}

describe('core transform basic branch compilation', () => {
  it.each([
    { val: 20, kept: 'a = 1;', dropped: ['a = 2;', 'a = 3;'] },
    { val: 7, kept: 'a = 2;', dropped: ['a = 1;', 'a = 3;'] },
    { val: 0, kept: 'a = 3;', dropped: ['a = 1;', 'a = 2;'] },
  ])('selects correct branch for case2 when VAL=$val', ({ val, kept, dropped }) => {
    const output = transformCase('case2.js', { VAL: val });

    expect(output).toContain(kept);
    for (const item of dropped) {
      expect(output).not.toContain(item);
    }
    expect(output).not.toContain('#if');
    expect(output).not.toContain('#elseif');
    expect(output).not.toContain('#else');
    expect(output).not.toContain('#endif');
  });

  it('handles #else branch toggling for case9', () => {
    const truthy = transformCase('case9.js', { A: true });
    const falsy = transformCase('case9.js', { A: false });

    expect(truthy).toContain("console.log('1');");
    expect(truthy).not.toContain("console.log('2');");

    expect(falsy).not.toContain("console.log('1');");
    expect(falsy).toContain("console.log('2');");
  });

  it('keeps non-conditional code while removing false branches (case1)', () => {
    const output = transformCase('case1.js', {});

    expect(output).not.toContain('const a = 2;');
    expect(output).toContain('const b = 1;');
  });

  it('returns untouched code when parse found no directives', () => {
    const code = loadjs('case3.js');
    const nodes = parse(code);
    const result = apply(code, nodes, {}, { filename: 'case3.js' });

    expect(result.code).toBe(code);
  });
});
