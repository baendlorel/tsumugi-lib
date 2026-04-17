import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { apply } from '../src/core/transform.js';
import { loadjs } from './setup.js';

describe('core transform', () => {
  it('removes directive lines and keeps selected branches', () => {
    const code = loadjs('case10.js');
    const nodes = parse(code);
    const result = apply(code, nodes, { A: false, B: true, C: false, X: true, Y: false, Z: true });

    expect(result.code).toContain("console.log('b-true');");
    expect(result.code).toContain("console.log('x-start');");
    expect(result.code).toContain("console.log('xz-true');");
    expect(result.code).toContain("console.log('x-end');");
    expect(result.code).not.toContain("console.log('a-true');");
    expect(result.code).not.toContain("console.log('xy-true');");
    expect(result.code).not.toContain("console.log('x-but-not-yz');");
    expect(result.code).not.toContain('#if');
    expect(result.code).not.toContain('#elseif');
    expect(result.code).not.toContain('#else');
    expect(result.code).not.toContain('#endif');
  });

  it('short-circuits elseif evaluation when if is already true', () => {
    const code = loadjs('case16.js');
    const nodes = parse(code);
    const result = apply(code, nodes, { VALID: true, BROKEN: true });

    expect(result.code).toContain("console.log('valid');");
    expect(result.code).not.toContain("console.log('broken-elif');");
    expect(result.code).not.toContain('#elseif');
  });

  it('can remove an entire false branch', () => {
    const code = loadjs('case1.js');
    const nodes = parse(code);
    const result = apply(code, nodes, {});

    expect(result.code).not.toContain('const a = 2;');
    expect(result.code).toContain('const b = 1;');
  });

  it('returns untouched code when no directives exist', () => {
    const code = loadjs('case3.js');
    const nodes = parse(code);
    const result = apply(code, nodes, {});

    expect(result.code).toBe(code);
  });

  it('supports function variables used in #if conditions', () => {
    const code = `// #if HAS_FEATURE('pro')
console.log('feature-on');
// #else
console.log('feature-off');
// #endif
`;
    const nodes = parse(code);
    const result = apply(code, nodes, {
      HAS_FEATURE: (name: string) => name === 'pro',
    });

    expect(result.code).toContain("console.log('feature-on');");
    expect(result.code).not.toContain("console.log('feature-off');");
  });

  it('keeps closure behavior of function variables', () => {
    const threshold = 10;
    const code = `// #if CHECK(12)
console.log('hit');
// #else
console.log('miss');
// #endif
`;
    const nodes = parse(code);
    const result = apply(code, nodes, {
      CHECK: (n: number) => n > threshold,
    });

    expect(result.code).toContain("console.log('hit');");
    expect(result.code).not.toContain("console.log('miss');");
  });

  it('throws when variable names are not valid identifiers', () => {
    const code = `// #if FLAG
console.log('ok');
// #endif
`;
    const nodes = parse(code);
    expect(() => apply(code, nodes, { 'bad-key': true })).toThrow(/Invalid variable name/);
  });

  it('generates sourcemap with expected basic fields', () => {
    const code = loadjs('case9.js');
    const nodes = parse(code);
    const result = apply(code, nodes, { A: true }, { filename: 'case9.js' });

    expect(result.map.version).toBe(3);
    expect(result.map.file).toBe('case9.js');
    expect(result.map.sources).toEqual(['case9.js']);
    expect(result.map.sourcesContent?.[0]).toBe(code);
    expect(typeof result.map.mappings).toBe('string');
    expect(result.map.mappings.length).toBeGreaterThan(0);
  });
});
