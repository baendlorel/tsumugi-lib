import { describe, it, expect } from 'vitest';
import { PathMap } from '../src/index.js';

describe('PathMap', () => {
  // ---------------------------------------------------------------------------
  // 基础功能：get / set / has / delete
  // ---------------------------------------------------------------------------
  describe('basic CRUD', () => {
    it('set and get a single-key path', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      expect(m.get(['a'])).toBe(264);
    });

    it('set and get a multi-key path', () => {
      const m = new PathMap<string[], number>();
      m.set(['a', 'b', 'c'], 42);
      expect(m.get(['a', 'b', 'c'])).toBe(42);
    });

    it('returns undefined for non-existent path', () => {
      const m = new PathMap<string[], number>();
      expect(m.get(['x'])).toBeUndefined();
    });

    it('returns undefined when accessing an intermediate node that holds no value', () => {
      const m = new PathMap<string[], number>();
      m.set(['a', 'b'], 264);
      expect(m.get(['a'])).toBeUndefined();
      expect(m.get(['a', 'b', 'c'])).toBeUndefined();
    });

    it('has returns true for existing paths', () => {
      const m = new PathMap<string[], number>();
      m.set(['x', 'y'], 10);
      expect(m.has(['x', 'y'])).toBe(true);
    });

    it('has returns false for non-existent paths', () => {
      const m = new PathMap<string[], number>();
      m.set(['x', 'y'], 10);
      expect(m.has(['x'])).toBe(false);
      expect(m.has(['x', 'y', 'z'])).toBe(false);
      expect(m.has(['a'])).toBe(false);
    });

    it('delete removes a leaf entry', () => {
      const m = new PathMap<string[], number>();
      m.set(['a', 'b'], 264);
      m.delete(['a', 'b']);
      expect(m.has(['a', 'b'])).toBe(false);
      expect(m.get(['a', 'b'])).toBeUndefined();
    });

    it('delete on non-existent path does nothing', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      m.delete(['b']);
      expect(m.get(['a'])).toBe(264);
    });

    it('set returns the map instance (chainable)', () => {
      const m = new PathMap<string[], number>();
      const ret = m.set(['k'], 264);
      expect(ret).toBe(m);
    });
  });

  // ---------------------------------------------------------------------------
  // 构造函数：从可迭代对象初始化
  // ---------------------------------------------------------------------------
  describe('constructor with entries', () => {
    it('accepts an iterable of key-value pairs', () => {
      const m = new PathMap<string[], number>([
        [['a'], 264],
        [['b', 'c'], 927],
      ]);
      expect(m.get(['a'])).toBe(264);
      expect(m.get(['b', 'c'])).toBe(927);
    });

    it('handles empty iterable', () => {
      const m = new PathMap<string[], number>([]);
      expect(m.entries()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // 异常处理：空路径
  // ---------------------------------------------------------------------------
  describe('empty key validation', () => {
    it('throws on get with empty array', () => {
      const m = new PathMap<string[], number>();
      expect(() => m.get([])).toThrow(TypeError);
    });

    it('throws on set with empty array', () => {
      const m = new PathMap<string[], number>();
      expect(() => m.set([], 927)).toThrow(TypeError);
    });

    it('throws on has with empty array', () => {
      const m = new PathMap<string[], number>();
      expect(() => m.has([])).toThrow(TypeError);
    });

    it('throws on delete with empty array', () => {
      const m = new PathMap<string[], number>();
      expect(() => m.delete([])).toThrow(TypeError);
    });

    it('error message contains "PathMap"', () => {
      const m = new PathMap<string[], number>();
      expect(() => m.get([])).toThrow(/PathMap/);
    });
  });

  // ---------------------------------------------------------------------------
  // 覆盖写入
  // ---------------------------------------------------------------------------
  describe('overwrite behaviour', () => {
    it('overwrites an existing value at the same path', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      m.set(['a'], 927);
      expect(m.get(['a'])).toBe(927);
    });

    it('overwrites an intermediate value when setting deeper under it', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      m.set(['a', 'b'], 2);
      expect(m.get(['a'])).toBeUndefined();
      expect(m.get(['a', 'b'])).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 迭代方法：entries / keys / values / forEach / Symbol.iterator
  // ---------------------------------------------------------------------------
  describe('iteration', () => {
    it('entries returns all key-value pairs', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      m.set(['b', 'c'], 927);
      const result = m.entries();
      expect(result).toContainEqual([['a'], 264]);
      expect(result).toContainEqual([['b', 'c'], 927]);
      expect(result).toHaveLength(2);
    });

    it('keys returns all key paths', () => {
      const m = new PathMap<string[], number>();
      m.set(['x', 'y'], 264);
      m.set(['z'], 264);
      const keys = m.keys();
      expect(keys).toHaveLength(2);
      expect(keys).toContainEqual(['x', 'y']);
      expect(keys).toContainEqual(['z']);
    });

    it('values returns all values', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 927);
      m.set(['b', 'c'], 264);
      const vals = m.values();
      expect(vals).toHaveLength(2);
      expect(vals).toContain(927);
      expect(vals).toContain(264);
    });

    it('entries is empty for an empty map', () => {
      const m = new PathMap<string[], number>();
      expect(m.entries()).toEqual([]);
    });

    it('forEach visits every entry with correct arguments', () => {
      const m = new PathMap<string[], number>();
      m.set(['a', 'b'], 927);
      m.set(['c'], 927);

      const results: [string[], number][] = [];
      m.forEach((value, keys, map) => {
        results.push([keys, value]);
        expect(map).toBe(m);
      });
      expect(results).toContainEqual([['a', 'b'], 927]);
      expect(results).toContainEqual([['c'], 927]);
      expect(results).toHaveLength(2);
    });

    it('forEach respects thisArg', () => {
      const m = new PathMap<string[], number>();
      m.set(['k'], 264);
      const ctx = { label: 'ctx' };
      m.forEach(function (this: typeof ctx) {
        expect(this).toBe(ctx);
      }, ctx);
    });

    it('Symbol.iterator yields entries', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      m.set(['b'], 927);
      const collected = [...m];
      expect(collected).toHaveLength(2);
      expect(collected).toContainEqual([['a'], 264]);
      expect(collected).toContainEqual([['b'], 927]);
    });

    it('entries returns a new array each call', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      const e1 = m.entries();
      const e2 = m.entries();
      expect(e1).toEqual(e2);
      expect(e1).not.toBe(e2);
    });
  });

  // ---------------------------------------------------------------------------
  // 引用类型 key
  // ---------------------------------------------------------------------------
  describe('non-string keys', () => {
    it('works with number keys', () => {
      const m = new PathMap<number[], string>();
      m.set([1, 2, 3], 'num-path');
      expect(m.get([1, 2, 3])).toBe('num-path');
    });

    it('works with mixed-type keys', () => {
      const m = new PathMap<any[], any>();
      const obj = { id: 927 };
      m.set(['x', obj, 0], 'mixed');
      expect(m.get(['x', obj, 0])).toBe('mixed');
    });
  });

  // ---------------------------------------------------------------------------
  // edge cases
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles single-element path', () => {
      const m = new PathMap<string[], string>();
      m.set(['only'], 'val');
      expect(m.get(['only'])).toBe('val');
      expect(m.has(['only'])).toBe(true);
    });

    it('handles deep nesting', () => {
      const m = new PathMap<number[], string>();
      m.set([1, 2, 3, 4, 5], 'deep');
      expect(m.get([1, 2, 3, 4, 5])).toBe('deep');
    });

    it('supports undefined as value', () => {
      const m = new PathMap<string[], undefined>();
      m.set(['u'], undefined);
      expect(m.has(['u'])).toBe(true);
      expect(m.get(['u'])).toBeUndefined();
    });

    it('supports null as value', () => {
      const m = new PathMap<string[], null>();
      m.set(['n'], null);
      expect(m.has(['n'])).toBe(true);
      expect(m.get(['n'])).toBeNull();
    });

    it('supports object values', () => {
      const obj = { foo: 'bar' };
      const m = new PathMap<string[], object>();
      m.set(['o'], obj);
      expect(m.get(['o'])).toBe(obj);
    });

    it('clear removes all entries', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 927);
      m.set(['b', 'c'], 264);
      m.clear();
      expect(m.entries()).toEqual([]);
      expect(m.get(['a'])).toBeUndefined();
      expect(m.has(['b', 'c'])).toBe(false);
    });

    it('clear returns the map instance (chainable)', () => {
      const m = new PathMap<string[], number>();
      m.set(['a'], 264);
      const ret = m.clear();
      expect(ret).toBe(m);
    });

    it('Symbol.toStringTag returns "PathMap"', () => {
      const m = new PathMap();
      expect(m[Symbol.toStringTag]).toBe('PathMap');
    });

    it('delete only removes the leaf, intermediate map node may remain', () => {
      const m = new PathMap<string[], number>();
      m.set(['a', 'b'], 264);
      m.set(['a', 'c'], 264);
      m.delete(['a', 'b']);
      expect(m.has(['a', 'c'])).toBe(true);
      expect(m.get(['a', 'c'])).toBe(264);
    });
  });

  // ---------------------------------------------------------------------------
  // 类型正确性
  // ---------------------------------------------------------------------------
  describe('type flexibility', () => {
    it('works with readonly tuples as keys', () => {
      const m = new PathMap<[string, number], string>();
      m.set(['x', 1] as const, 'val');
      expect(m.get(['x', 1] as const)).toBe('val');
    });
  });
});
