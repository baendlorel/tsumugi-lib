import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inlineFunction } from '../src/core/index.js';
import { apply, pr } from './utils.js';

describe('inlineFunction', () => {
  it('expands expression-body declarations at call site', () => {
    const plugin = inlineFunction({ names: ['add'] });
    const source = pr`function add(a, b) { return a + b; }
                    const out = add(1, 2);`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toContain('const out = ((1) + (2));');
    expect(transformed).not.toContain('function add');
    expect(transformed).not.toContain('add(1, 2)');
  });

  it('expands arrow expression functions', () => {
    const plugin = inlineFunction({ names: ['inc'] });
    const source = pr`const inc = (value) => value + 1;
                    const out = inc(41);`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toContain('const out = ((41) + 1);');
    expect(transformed).not.toContain('const inc =');
    expect(transformed).not.toContain('inc(41)');
  });

  it('keeps macro-style repeated argument evaluation', () => {
    const plugin = inlineFunction({ names: ['twice'] });
    const source = pr`let n = 0;
                    function twice(x) { return x + x; }
                    const out = twice(n++);
                    const snapshot = n;`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toContain('((n++) + (n++))');

    const runtime = new Function(`${transformed}; return { out, snapshot };`)();
    expect(runtime).toEqual({ out: 1, snapshot: 2 });
  });

  it('expands block-body calls as raw statements inside loops', () => {
    const plugin = inlineFunction({ names: ['loopwork'] });
    const source = pr`function loopwork(a, b) {
                      outputs.push(a + b);
                    }
                    const outputs = [];
                    for (let i = 0; i < 3; i++) {
                      loopwork(i, i * 2);
                    }`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toContain('outputs.push((i) + (i * 2));');
    expect(transformed).not.toContain('loopwork(i, i * 2)');
    expect(transformed).not.toContain('function loopwork');
    expect(transformed).not.toContain('(()=>{');

    const runtime = new Function(`${transformed}; return outputs;`)();
    expect(runtime).toEqual([0, 3, 6]);
  });

  it('expands in conditionals without leaving wrappers', () => {
    const plugin = inlineFunction({ names: ['inlined'] });
    const source = pr`function inlined(a, b, c) { return a + b + c; }
                    if (inlined(1, 2, 3)) {
                      console.log('ok');
                    }`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toContain('if (((1) + (2) + (3)))');
    expect(transformed).not.toContain('function inlined');
    expect(transformed).not.toContain('(()=>{');
  });

  it('only expands configured names', () => {
    const plugin = inlineFunction({ names: ['add'] });
    const source = pr`function add(a, b) { return a + b; }
                    function sub(a, b) { return a - b; }
                    const x = add(3, 2);
                    const y = sub(3, 2);`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toContain('const x = ((3) + (2));');
    expect(transformed).toContain('const y = sub(3, 2);');
  });

  it('respects inc/exclude filters', () => {
    const plugin = inlineFunction({
      names: ['add'],
      include: '**/*.ts',
      exclude: '**/*.skip.ts',
    });
    const source = pr`function add(a, b) { return a + b; }
                    const out = add(1, 2);`;

    const included = apply(plugin, source, 'entry.ts');
    const excluded = apply(plugin, source, 'entry.skip.ts');
    expect(included).toContain('const out = ((1) + (2));');
    expect(excluded).toBeNull();
  });

  it('skips mutable function bindings', () => {
    const plugin = inlineFunction({ names: ['add'] });
    const source = pr`let add = (a, b) => a + b;
                    add = (a, b) => a * b;
                    const out = add(1, 2);`;

    const transformed = apply(plugin, source, 'main.ts');
    expect(transformed).toBeNull();
  });

  it('expands functions imported from relative modules', () => {
    const plugin = inlineFunction({ names: ['loopwork'] });
    const tempDir = mkdtempSync(join(tmpdir(), 'inline-expand-'));

    try {
      writeFileSync(
        join(tempDir, 'utils.ts'),
        pr`export function loopwork(a, b) {
             outputs.push(a + b);
           }`,
      );

      const entryPath = join(tempDir, 'entry.ts');
      const source = pr`import { loopwork } from './utils';
                      const outputs = [];
                      for (let i = 0; i < 3; i++) {
                        loopwork(i, i * 2);
                      }`;

      const transformed = apply(plugin, source, entryPath);
      expect(transformed).toContain('outputs.push((i) + (i * 2));');
      expect(transformed).not.toContain('loopwork(i, i * 2)');

      const executable = transformed?.replace(/^\s*import[^\n]*\n/gm, '') ?? '';
      const runtime = new Function(`${executable}; return outputs;`)();
      expect(runtime).toEqual([0, 3, 6]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
