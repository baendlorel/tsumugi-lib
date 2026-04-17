import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { apply } from '../src/core/transform.js';
import { loadjs } from './setup.js';

function compile(code: string, variables: Record<string, unknown>) {
  const nodes = parse(code);
  return apply(code, nodes, variables).code;
}

describe('transform: advanced scenarios (full parse + transform)', () => {
  it('case10: chooses the first truthy branch in a long elseif chain', () => {
    const code = loadjs('case10.js');
    const out = compile(code, { A: false, B: false, C: true, X: false, Y: false, Z: false });

    expect(out).toContain("console.log('c-true');");
    expect(out).not.toContain("console.log('a-true');");
    expect(out).not.toContain("console.log('b-true');");
    expect(out).not.toContain("console.log('all-false');");
    expect(out).not.toContain('#if');
    expect(out).toContain("console.log('done10');");
  });

  it('case10: handles nested if blocks correctly', () => {
    const code = loadjs('case10.js');
    const out = compile(code, { A: false, B: false, C: false, X: true, Y: false, Z: true });

    expect(out).toContain("console.log('xz-true');");
    expect(out).toContain("console.log('x-start');");
    expect(out).toContain("console.log('x-end');");
    expect(out).not.toContain("console.log('xy-true');");
    expect(out).not.toContain("console.log('x-but-not-yz');");
  });

  it('case12: supports complex expressions (comparisons + boolean ops)', () => {
    const code = loadjs('case12.js');
    const out = compile(code, { A: 7, X: true, Y: false, TYPE: 'dev' });

    expect(out).toContain("console.log('a-medium');");
    expect(out).toContain("console.log('xy-either');");
    expect(out).toContain("console.log('development');");

    expect(out).not.toContain("console.log('a-large');");
    expect(out).not.toContain("console.log('xy-both');");
    expect(out).not.toContain("console.log('production');");
  });

  it('short-circuits evaluation of later elseif when an earlier branch matches', () => {
    const code = `// #if true\nconsole.log('taken');\n// #elseif UNKNOWN_VAR + 1\nconsole.log('skipped');\n// #endif\n`;

    const out = compile(code, {});
    expect(out).toContain("console.log('taken');");
    expect(out).not.toContain("console.log('skipped');");
  });

  it('skips evaluating nested conditions inside an inactive parent branch', () => {
    let called = 0;
    const out = compile(
      `// #if OUTER\n// #if SIDE_EFFECT()\nconsole.log('inner');\n// #endif\n// #endif\n`,
      {
        OUTER: false,
        SIDE_EFFECT: () => {
          called += 1;
          return true;
        },
      },
    );

    expect(called).toBe(0);
    expect(out).not.toContain("console.log('inner');");
  });
});
