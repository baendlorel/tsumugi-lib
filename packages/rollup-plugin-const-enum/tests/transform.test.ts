import path from 'node:path';
import { describe, expect, it } from 'vitest';
import constEnum from '../src/index.js';
import { createTestEnvironment, simulateTransform, simulateTransformResult } from './helpers.js';

describe('constEnum transform', () => {
  it('inlines same-file const enums', () => {
    const env = createTestEnvironment('same-file-' + Date.now());
    const code = `const enum Color { Red = 0 }
export const value = Color.Red;`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum();
      const result = simulateTransform(plugin, code, id);

      expect(result).toContain('export const value = 0;');
    } finally {
      env.cleanup();
    }
  });

  it('inlines imported const enums', () => {
    const env = createTestEnvironment('imported-const-' + Date.now());
    env.writeFile('enums.ts', `export const enum Color { Red = 0, Blue = 2 }`);
    const code = `import { Color } from './enums';
export const value = Color.Red + Color.Blue;`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum();
      const result = simulateTransform(plugin, code, id);

      expect(result).toContain('export const value = 0 + 2;');
    } finally {
      env.cleanup();
    }
  });

  it('does not inline enums that are not imported', () => {
    const env = createTestEnvironment('not-imported-' + Date.now());
    env.writeFile('enums.ts', `export const enum Color { Red = 0 }`);
    const code = `export const value = Color.Red;`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum();
      const result = simulateTransform(plugin, code, id);

      expect(result).toBeNull();
    } finally {
      env.cleanup();
    }
  });

  it('supports namespace imports and string element access', () => {
    const env = createTestEnvironment('namespace-import-' + Date.now());
    env.writeFile('enums.ts', `export const enum Color { Red = 0 }`);
    const code = `import * as palette from './enums';
export const value = palette.Color['Red'];`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum();
      const result = simulateTransform(plugin, code, id);

      expect(result).toContain('export const value = 0;');
    } finally {
      env.cleanup();
    }
  });

  it('only inlines regular enums when inlineNonConstEnums is enabled', () => {
    const env = createTestEnvironment('regular-enum-' + Date.now());
    env.writeFile('enums.ts', `export enum Color { Red = 1 }`);
    const code = `import { Color } from './enums';
export const value = Color.Red;`;
    const id = env.writeFile('entry.ts', code);

    try {
      const disabled = constEnum();
      const enabled = constEnum({ inlineNonConstEnums: true });

      expect(simulateTransform(disabled, code, id)).toBeNull();
      expect(simulateTransform(enabled, code, id)).toContain('export const value = 1;');
    } finally {
      env.cleanup();
    }
  });

  it('filters by inlineNames', () => {
    const env = createTestEnvironment('inline-names-' + Date.now());
    env.writeFile(
      'enums.ts',
      `export const enum Color { Red = 0 }
export const enum Status { Active = 'active' }`,
    );
    const code = `import { Color, Status } from './enums';
export const color = Color.Red;
export const status = Status.Active;`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum({ inlineNames: ['Status'] });
      const result = simulateTransform(plugin, code, id);

      expect(result).toContain('export const color = Color.Red;');
      expect(result).toContain('export const status = "active";');
    } finally {
      env.cleanup();
    }
  });

  it('keeps numeric member-access output syntactically valid', () => {
    const env = createTestEnvironment('numeric-member-access-' + Date.now());
    const code = `const enum Color { Red = 0 }
export const value = Color.Red.toString();`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum();
      const result = simulateTransform(plugin, code, id);

      expect(result).toContain('export const value = (0).toString();');
    } finally {
      env.cleanup();
    }
  });

  it('returns a sourcemap for transformed files', () => {
    const env = createTestEnvironment('sourcemap-' + Date.now());
    const code = `const enum Color { Red = 0 }
export const value = Color.Red;`;
    const id = env.writeFile('entry.ts', code);

    try {
      const plugin = constEnum();
      const result = simulateTransformResult(plugin, code, id);

      expect(result).not.toBeNull();
      expect(result!.map).toBeTruthy();
      expect((result!.map as any).file).toBe(path.basename(id));
      expect((result!.map as any).sources.length).toBeGreaterThan(0);
      expect((result!.map as any).mappings.length).toBeGreaterThan(0);
    } finally {
      env.cleanup();
    }
  });
});
