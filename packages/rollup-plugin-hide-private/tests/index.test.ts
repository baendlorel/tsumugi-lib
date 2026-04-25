import { join } from 'node:path';
import type { OutputChunk } from 'rollup';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import { describe, expect, it } from 'vitest';
import hidePrivate, { stripHiddenDeclarations } from '../src/index.js';

const fixturePath = join(import.meta.dirname, '.mock', 'entry.ts');

describe('stripHiddenDeclarations', () => {
  it('removes private and protected members by default', () => {
    const code = `
export declare class Example {
  visible: string;
  private hiddenToken: string;
  protected hiddenCount: number;
  protected hiddenMethod(): void;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'example.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('hiddenToken');
    expect(result.code).not.toContain('hiddenCount');
    expect(result.code).not.toContain('hiddenMethod');
    expect(result.map?.version).toBe(3);
    expect(result.map?.file).toBe('example.d.ts');
    expect(result.map?.sources).toEqual(['example.d.ts']);
  });

  it('removes members matched by allNames regardless of visibility', () => {
    const code = `
export declare class Example {
  visible: string;
  debugOnly: string;
  private keepPrivate: string;
  protected keepProtected(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: false,
        protectNames: false,
        allNames: ['debugOnly'],
      },
      'all-names.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly');
    expect(result.code).toContain('keepPrivate');
    expect(result.code).toContain('keepProtected');
  });

  it('supports name filtering for private and protected members', () => {
    const code = `
export declare class Example {
  private dropToken: string;
  private keepToken: string;
  protected dropMethod(): void;
  protected keepMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: [/^drop/],
        protectNames: ['dropMethod'],
      },
      'filtered.d.ts',
    );

    expect(result.code).not.toContain('dropToken');
    expect(result.code).toContain('keepToken');
    expect(result.code).not.toContain('dropMethod');
    expect(result.code).toContain('keepMethod');
  });

  it('rejects invalid allNames values', () => {
    const code = `
export declare class Example {
  visible: string;
}
`;

    expect(() =>
      stripHiddenDeclarations(code, { allNames: true as unknown as Array<string | RegExp> }, 'invalid-all-names.d.ts'),
    ).toThrow(TypeError);

    expect(() =>
      stripHiddenDeclarations(code, { allNames: ['visible', 1 as unknown as RegExp] }, 'invalid-all-names-item.d.ts'),
    ).toThrow(TypeError);
  });

  it('keeps members when both matchers are false', () => {
    const code = `
export declare class Example {
  private keepToken: string;
  protected keepMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: false,
        protectNames: false,
      },
      'keep-all.d.ts',
    );

    expect(result.changed).toBe(false);
    expect(result.code).toContain('keepToken');
    expect(result.code).toContain('keepMethod');
  });
});

describe('rollup-plugin-hide-private', () => {
  it('generates declaration output with a sourcemap', async () => {
    const bundle = await rollup({
      input: fixturePath,
      plugins: [dts(), hidePrivate()],
    });

    try {
      const { output } = await bundle.generate({
        format: 'es',
        sourcemap: true,
        entryFileNames: 'index.d.ts',
      });

      const chunk = output.find((item): item is OutputChunk => item.type === 'chunk');
      expect(chunk).toBeDefined();
      expect(chunk?.fileName).toBe('index.d.ts');
      expect(chunk?.code).toContain('visible: string;');
      expect(chunk?.code).not.toContain('token');
      expect(chunk?.code).not.toContain('internalState');
      expect(chunk?.map?.version).toBe(3);
      expect(chunk?.map?.file).toBe('index.d.ts');
      expect(chunk?.map?.sources.length).toBeGreaterThan(0);
      expect(typeof chunk?.map?.mappings).toBe('string');
    } finally {
      await bundle.close();
    }
  });
});
