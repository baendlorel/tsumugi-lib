import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join, resolve } from 'node:path';
import { createFilters, getFiles } from '../src/get-files.js';

// Get absolute paths for testing
const cwd = (relativePath: string) => join(process.cwd(), relativePath);

describe('getFiles - Include/Exclude Functionality', () => {
  describe('Basic Include Patterns', () => {
    it('should include all .d.ts files when include is undefined', () => {
      const { includes } = createFilters('**/*.d.ts', null);

      expect(includes(cwd('common.d.ts'))).toBe(true);
      expect(includes(cwd('simple.d.ts'))).toBe(true);
      expect(includes(cwd('nested/nested.d.ts'))).toBe(true);
      expect(includes(cwd('deep/level/deep.d.ts'))).toBe(true);
    });

    it('should include specific file by exact path', () => {
      const { includes } = createFilters('simple.d.ts', null);
      expect(includes(cwd('simple.d.ts'))).toBe(true);
      expect(includes(cwd('common.d.ts'))).toBe(false);
    });

    it('should include multiple specific files', () => {
      const file1 = cwd('simple.d.ts');
      const file2 = cwd('common.d.ts');
      const { includes } = createFilters([file1, file2], null);

      expect(includes(file1)).toBeTruthy();
      expect(includes(file2)).toBeTruthy();
    });
  });

  describe('Exclude Patterns', () => {
    it('should exclude specific file', () => {
      const excludeFile = cwd('excluded.d.ts');
      const { includes, excludes } = createFilters('**/*.d.ts', 'excluded.d.ts');

      expect(includes(excludeFile)).toBeTruthy(); // also satisfies includes
      expect(excludes(excludeFile)).toBeTruthy();
      expect(excludes('simple.d.ts')).toBeFalsy();
    });

    it('should exclude files matching pattern', () => {
      const { includes, excludes } = createFilters('**/*.d.ts', 'multi-*.d.ts');

      expect(excludes(cwd('multi-file-1.d.ts'))).toBeTruthy();
      expect(excludes(cwd('multi-file-1.d.ts'))).toBeTruthy();
      expect(excludes(cwd('multi-file-123.d.ts'))).toBeTruthy();
      expect(excludes(cwd('common.d.ts'))).toBeFalsy();
    });

    it('should exclude entire directory', () => {
      const { includes, excludes } = createFilters('**/*.d.ts', 'nested/**');
      expect(excludes(cwd('nested/nested.d.ts'))).toBeTruthy();
      expect(excludes(cwd('nested/specific.d.ts'))).toBeTruthy();
      expect(excludes(cwd('common.d.ts'))).toBeFalsy();
    });
  });

  describe('Relative Path Handling', () => {
    it('should work with relative paths in patterns', () => {
      const files = getFiles('**/*.d.ts', null); //! directly writes *.d.ts is wrong

      expect(files.some((f: string) => f.endsWith('.d.ts'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('simple.d.ts'))).toBe(false);
    });
  });
});
