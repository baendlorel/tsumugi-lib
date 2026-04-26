import { expect, describe, it } from 'vitest';
import constEnum from '../src/index.js';

describe('constEnum plugin integration', () => {
  describe('plugin creation', () => {
    it('should create plugin with default options', () => {
      const plugin = constEnum();

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('__NAME__');
      expect(plugin.transform).toBeDefined();
    });

    it('should create plugin with custom options', () => {
      const plugin = constEnum({
        inlineNonConstEnums: true,
        inlineNames: ['Color'],
      });

      expect(plugin).toBeDefined();
      expect(plugin.transform).toBeDefined();
    });
  });

  describe('transform guard', () => {
    it('should return null when no replacements are needed', () => {
      const plugin = constEnum();

      const code = 'const x = 42;'; // No enum references
      const result = (plugin.transform as Function)(code, '/tmp/example.ts');

      expect(result).toBeNull();
    });

    it('should skip non-typescript files', () => {
      const plugin = constEnum();

      const code = 'const color = Color.Red;';
      const result = (plugin.transform as Function)(code, '/tmp/example.js');

      expect(result).toBeNull();
    });
  });
});
