import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { apply } from '../src/core/transform.js';
import { loadjs } from './setup.js';

function run(name: `case${number}.js`, variables: Record<string, unknown>) {
  const code = loadjs(name);
  return apply(code, parse(code), variables).code;
}

describe('transform evaluation safety', () => {
  it('skips malformed elseif expressions when a previous branch already matched (case16)', () => {
    const out = run('case16.js', { VALID: true, BROKEN: true });

    expect(out).toContain("console.log('valid');");
    expect(out).not.toContain("console.log('broken-elif');");
  });

  it('throws when the selected branch has malformed syntax', () => {
    const code = `// #if false\nkeep();\n// #elseif (BROKEN &&\nbad();\n// #endif\n`;

    expect(() => apply(code, parse(code), { BROKEN: true })).toThrow();
  });

  it('throws when branch expression references missing variables and must be evaluated', () => {
    const code = `// #if UNKNOWN_FLAG\nkeep();\n// #endif\n`;

    expect(() => apply(code, parse(code), {})).toThrow();
  });
});
