import { expect, describe, it } from 'vitest';
import { normalize } from '../src/options.js';

describe('normalize function', () => {
  describe('default values', () => {
    it('should return default options when called with no arguments', () => {
      const result = normalize();

      expect(result).toEqual({
        inlineNonConstEnums: false,
        inlineNames: undefined,
      });
    });

    it('should return default options when called with empty object', () => {
      const result = normalize({});

      expect(result).toEqual({
        inlineNonConstEnums: false,
        inlineNames: undefined,
      });
    });
  });

  describe('inlineNonConstEnums', () => {
    it('should accept true', () => {
      const result = normalize({ inlineNonConstEnums: true });

      expect(result.inlineNonConstEnums).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(() => normalize({ inlineNonConstEnums: 'invalid' as any })).toThrow(
        'Expected inlineNonConstEnums to be boolean.',
      );
    });
  });

  describe('inlineNames', () => {
    it('should accept string and RegExp entries', () => {
      const result = normalize({
        inlineNames: ['Color', /^Status$/],
      });

      expect(result).toEqual({
        inlineNonConstEnums: false,
        inlineNames: ['Color', /^Status$/],
      });
    });

    it('should reject non-array values', () => {
      expect(() => normalize({ inlineNames: 'Color' as any })).toThrow(
        'Expected inlineNames to be Array<string | RegExp>.',
      );
    });

    it('should reject invalid entries', () => {
      expect(() => normalize({ inlineNames: ['Color', 1] as any })).toThrow(
        'Expected inlineNames to be Array<string | RegExp>.',
      );
    });
  });
});
