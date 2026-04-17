import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parse.js';
import { apply } from '../src/core/transform.js';
import { loadjs } from './setup.js';

function compileMap(code: string, variables: Record<string, unknown>, filename = 'source.js') {
  const nodes = parse(code);
  return apply(code, nodes, variables, { filename }).map;
}

describe('transform sourcemap', () => {
  it('generates a valid map for a typical file', () => {
    const code = loadjs('case10.js');
    const map = compileMap(code, { A: false, B: true, C: false, X: false, Y: false, Z: false }, 'case10.js');

    expect(map.version).toBe(3);
    expect(map.file).toBe('case10.js');
    expect(map.sources).toEqual(['case10.js']);
    expect(map.sourcesContent?.[0]).toBe(code);
    expect(typeof map.mappings).toBe('string');
  });

  it('handles fully removed output without throwing', () => {
    const code = `// #if false\nconsole.log('removed');\n// #endif\n`;
    const map = compileMap(code, {}, 'empty.js');

    expect(map.file).toBe('empty.js');
    expect(map.sources).toEqual(['empty.js']);
  });
});
