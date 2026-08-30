import { describe, expect, it } from 'vitest';
import { isSpace } from '../src';

describe('isSpace', () => {
  describe('standard whitespace characters', () => {
    it('returns true for regular space', () => {
      expect(isSpace(' ')).toBe(true);
    });

    it('returns true for tab', () => {
      expect(isSpace('\t')).toBe(true);
    });

    it('returns true for newline', () => {
      expect(isSpace('\n')).toBe(true);
    });

    it('returns true for carriage return', () => {
      expect(isSpace('\r')).toBe(true);
    });

    it('returns true for form feed', () => {
      expect(isSpace('\f')).toBe(true);
    });

    it('returns true for vertical tab', () => {
      expect(isSpace('\v')).toBe(true);
    });
  });

  describe('unicode whitespace characters', () => {
    it('returns true for non-breaking space', () => {
      expect(isSpace(' ')).toBe(true);
    });

    it('returns true for line separator', () => {
      expect(isSpace('')).toBe(true);
    });

    it('returns true for paragraph separator', () => {
      expect(isSpace('')).toBe(true);
    });

    it('returns true for thin space', () => {
      expect(isSpace(' ')).toBe(true);
    });

    it('returns true for em space', () => {
      expect(isSpace(' ')).toBe(true);
    });

    it('returns true for en space', () => {
      expect(isSpace(' ')).toBe(true);
    });
  });

  describe('non-whitespace characters', () => {
    it('returns false for regular characters', () => {
      expect(isSpace('a')).toBe(false);
      expect(isSpace('Z')).toBe(false);
      expect(isSpace('5')).toBe(false);
      expect(isSpace('@')).toBe(false);
    });

    it('returns true for empty string (edge case: "".trim() === "")', () => {
      expect(isSpace('')).toBe(true);
    });

    it('returns false for special characters', () => {
      expect(isSpace('!')).toBe(false);
      expect(isSpace('#')).toBe(false);
      expect(isSpace('$')).toBe(false);
      expect(isSpace('%')).toBe(false);
    });

    it('returns false for emojis', () => {
      expect(isSpace('🚀')).toBe(false);
      expect(isSpace('😀')).toBe(false);
      expect(isSpace('❤️')).toBe(false);
    });

    it('returns false for non-Latin characters', () => {
      expect(isSpace('中')).toBe(false);
      expect(isSpace('日')).toBe(false);
      expect(isSpace('한')).toBe(false);
      expect(isSpace('あ')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles multi-character strings (only checks if all chars are spaces)', () => {
      // The function uses trim() which removes all whitespace
      expect(isSpace('  ')).toBe(true);
      expect(isSpace(' \t\n')).toBe(true);
      expect(isSpace(' a')).toBe(false);
      expect(isSpace('a ')).toBe(false);
    });

    it('handles strings with mixed content', () => {
      expect(isSpace(' \ta')).toBe(false);
      expect(isSpace('a\t ')).toBe(false);
    });

    it('returns false for single non-space character in whitespace string', () => {
      expect(isSpace(' \n\ta')).toBe(false);
    });
  });

  describe('implementation behavior', () => {
    it('uses trim() logic - removes all whitespace characters', () => {
      // This verifies the implementation uses trim() === ''
      expect(isSpace(' \t\n\r\f\v')).toBe(true);
      expect(isSpace('    ')).toBe(true);
    });
  });
});
