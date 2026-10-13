import { describe, expect, it, vi } from 'vitest';
import { DuoMap } from '../src/index.js';

describe('DuoMap', () => {
  // ---------------------------------------------------------------------------
  // set()
  // ---------------------------------------------------------------------------
  describe('set()', () => {
    it('stores a value under two keys and reads it back', () => {
      const map = new DuoMap<string, number, string>();

      map.set('users', 1, 'alice');

      expect(map.get('users', 1)).toBe('alice');
      expect(map.size).toBe(1);
    });

    it('returns this, so calls chain', () => {
      const map = new DuoMap<string, string, number>();

      const returned = map.set('a', 'x', 1).set('a', 'y', 2).set('b', 'x', 3);

      expect(returned).toBe(map);
      expect(map.size).toBe(3);
    });

    it('keeps the same key2 of different key1 apart', () => {
      const map = new DuoMap<string, string, number>();

      map.set('a', 'shared', 1);
      map.set('b', 'shared', 2);

      expect(map.get('a', 'shared')).toBe(1);
      expect(map.get('b', 'shared')).toBe(2);
      expect(map.size).toBe(2);
    });

    it('overwrites the value of an existing pair', () => {
      const map = new DuoMap<string, string, number>();

      map.set('a', 'x', 1);
      map.set('a', 'x', 2);

      expect(map.get('a', 'x')).toBe(2);
      expect(map.size).toBe(1);
    });

    it('compares keys by SameValueZero, like Map', () => {
      const map = new DuoMap<unknown, unknown, string>();

      map.set(NaN, -0, 'weird');

      expect(map.get(NaN, 0)).toBe('weird');
      expect(map.has(NaN, -0)).toBe(true);
      expect(map.size).toBe(1);
    });

    it('stores a value that is itself undefined', () => {
      const map = new DuoMap<string, string, undefined>();

      map.set('a', 'x', undefined);

      expect(map.has('a', 'x')).toBe(true);
      expect(map.size).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // get()
  // ---------------------------------------------------------------------------
  describe('get()', () => {
    it('returns undefined for an unknown key1, key2, or both', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      expect(map.get('nope', 'x')).toBeUndefined();
      expect(map.get('a', 'nope')).toBeUndefined();
      expect(map.get('nope', 'nope')).toBeUndefined();
    });

    it('returns the very same reference it stored', () => {
      const map = new DuoMap<string, string, { list: number[] }>();
      const value = { list: [1, 2] };

      map.set('a', 'x', value);
      map.get('a', 'x')!.list.push(3);

      expect(map.get('a', 'x')).toBe(value);
      expect(value.list).toEqual([1, 2, 3]);
    });
  });

  // ---------------------------------------------------------------------------
  // getOrInsert()
  // ---------------------------------------------------------------------------
  describe('getOrInsert()', () => {
    it('inserts and returns the value when the pair is missing', () => {
      const map = new DuoMap<string, string, number>();

      expect(map.getOrInsert('a', 'x', 1)).toBe(1);
      expect(map.get('a', 'x')).toBe(1);
      expect(map.size).toBe(1);
    });

    it('returns the existing value without replacing it', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      expect(map.getOrInsert('a', 'x', 2)).toBe(1);
      expect(map.get('a', 'x')).toBe(1);
    });

    it('does not overwrite a stored undefined', () => {
      const map = new DuoMap<string, string, number | undefined>();
      map.set('a', 'x', undefined);

      expect(map.getOrInsert('a', 'x', 1)).toBeUndefined();
      expect(map.get('a', 'x')).toBeUndefined();
    });

    it('does not disturb the other key2 values under the same key1', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      map.getOrInsert('a', 'y', 2);

      expect(map.get('a', 'x')).toBe(1);
      expect(map.get('a', 'y')).toBe(2);
      expect(map.size).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getOrInsertComputed()
  // ---------------------------------------------------------------------------
  describe('getOrInsertComputed()', () => {
    it('computes, stores and returns the value when the pair is missing', () => {
      const map = new DuoMap<string, string, string>();

      expect(map.getOrInsertComputed('a', 'x', () => 'computed')).toBe('computed');
      expect(map.get('a', 'x')).toBe('computed');
    });

    it('does not call compute when the pair already exists', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      const compute = vi.fn(() => 2);

      expect(map.getOrInsertComputed('a', 'x', compute)).toBe(1);
      expect(compute).not.toHaveBeenCalled();
    });

    it('does not call compute when the stored value is undefined', () => {
      const map = new DuoMap<string, string, number | undefined>();
      map.set('a', 'x', undefined);
      const compute = vi.fn(() => 1);

      expect(map.getOrInsertComputed('a', 'x', compute)).toBeUndefined();
      expect(compute).not.toHaveBeenCalled();
    });

    it('computes once per missing pair and caches the result', () => {
      const map = new DuoMap<string, string, number>();
      const compute = vi.fn(() => 42);

      map.getOrInsertComputed('a', 'x', compute);
      map.getOrInsertComputed('a', 'x', compute);

      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('leaves the map unchanged when compute throws', () => {
      const map = new DuoMap<string, string, number>();

      expect(() =>
        map.getOrInsertComputed('a', 'x', () => {
          throw new Error('compute boom');
        }),
      ).toThrow('compute boom');

      expect(map.has('a', 'x')).toBe(false);
      expect(map.size).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // has()
  // ---------------------------------------------------------------------------
  describe('has()', () => {
    it('reports whether a pair exists', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      expect(map.has('a', 'x')).toBe(true);
      expect(map.has('a', 'y')).toBe(false);
      expect(map.has('b', 'x')).toBe(false);
    });

    it('is true for a pair whose value is undefined', () => {
      const map = new DuoMap<string, string, undefined>();
      map.set('a', 'x', undefined);

      expect(map.has('a', 'x')).toBe(true);
    });

    it('does not create the entry when asked about a missing key1', () => {
      const map = new DuoMap<string, string, number>();

      map.has('a', 'x');

      expect(map.size).toBe(0);
      expect(map.keys()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // delete()
  // ---------------------------------------------------------------------------
  describe('delete()', () => {
    it('removes a pair and reports whether it existed', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      expect(map.delete('a', 'x')).toBe(true);
      expect(map.get('a', 'x')).toBeUndefined();
      expect(map.has('a', 'x')).toBe(false);
      expect(map.delete('a', 'x')).toBe(false);
    });

    it('returns false for an unknown key1 without throwing', () => {
      const map = new DuoMap<string, string, number>();

      expect(map.delete('nope', 'x')).toBe(false);
    });

    it('drops the inner map once its last pair is gone', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.set('a', 'y', 2);

      map.delete('a', 'x');

      // `a` still has `y`, so the group survives with a smaller size.
      expect(map.size).toBe(1);
      expect(map.keys()).toEqual([['a', 'y']]);

      map.delete('a', 'y');

      expect(map.size).toBe(0);
      expect(map.keys()).toEqual([]);
    });

    it('leaves sibling key1 groups untouched', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.set('b', 'x', 2);

      map.delete('a', 'x');

      expect(map.get('b', 'x')).toBe(2);
      expect(map.size).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // clear()
  // ---------------------------------------------------------------------------
  describe('clear()', () => {
    it('empties the map', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1).set('a', 'y', 2).set('b', 'z', 3);

      map.clear();

      expect(map.size).toBe(0);
      expect(map.entries()).toEqual([]);
      expect(map.get('a', 'x')).toBeUndefined();
    });

    it('leaves the map usable afterwards', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.clear();

      map.set('a', 'x', 2);

      expect(map.get('a', 'x')).toBe(2);
      expect(map.size).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // size
  // ---------------------------------------------------------------------------
  describe('size', () => {
    it('is 0 when empty', () => {
      expect(new DuoMap().size).toBe(0);
    });

    it('counts pairs across all key1 groups, not groups', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1).set('a', 'y', 2).set('b', 'x', 3);

      expect(map.size).toBe(3);
    });

    it('counts a stored undefined value', () => {
      const map = new DuoMap<string, string, undefined>();
      map.set('a', 'x', undefined);

      expect(map.size).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // forEach()
  // ---------------------------------------------------------------------------
  describe('forEach()', () => {
    it('visits every pair with (value, key1, key2)', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.set('a', 'y', 2);
      map.set('b', 'x', 3);

      const seen: [number, string, string][] = [];
      map.forEach((value, key1, key2) => seen.push([value, key1, key2]));

      expect(seen).toEqual([
        [1, 'a', 'x'],
        [2, 'a', 'y'],
        [3, 'b', 'x'],
      ]);
    });

    it('does not visit an empty map', () => {
      const map = new DuoMap<string, string, number>();
      const callback = vi.fn();

      map.forEach(callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // keys() / values() / entries()
  // ---------------------------------------------------------------------------
  describe('keys(), values() and entries()', () => {
    it('returns arrays, not Map iterators', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      expect(Array.isArray(map.keys())).toBe(true);
      expect(Array.isArray(map.values())).toBe(true);
      expect(Array.isArray(map.entries())).toBe(true);
    });

    it('exposes keys as [key1, key2] pairs', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.set('b', 'y', 2);

      expect(map.keys()).toEqual([
        ['a', 'x'],
        ['b', 'y'],
      ]);
    });

    it('exposes values in the same order as keys and entries', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.set('a', 'y', 2);

      expect(map.values()).toEqual([1, 2]);
      expect(map.entries()).toEqual([
        ['a', 'x', 1],
        ['a', 'y', 2],
      ]);
    });

    it('returns a fresh array each call, so mutating it is harmless', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      const first = map.keys();
      first.push(['planted', 'key']);

      expect(map.keys()).toEqual([['a', 'x']]);
      expect(map.size).toBe(1);
    });

    it('returns empty arrays for an empty map', () => {
      const map = new DuoMap<string, string, number>();

      expect(map.keys()).toEqual([]);
      expect(map.values()).toEqual([]);
      expect(map.entries()).toEqual([]);
      expect([...map]).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // iteration
  // ---------------------------------------------------------------------------
  describe('iteration', () => {
    it('is iterable with for...of, yielding [key1, key2, value]', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);
      map.set('b', 'y', 2);

      const seen: [string, string, number][] = [];
      for (const entry of map) {
        seen.push(entry);
      }

      expect(seen).toEqual([
        ['a', 'x', 1],
        ['b', 'y', 2],
      ]);
    });

    it('spreads and destructures like a Map', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      const [[key1, key2, value]] = [...map];
      const asMap = new Map(map.entries().map(([k1, k2, v]) => [`${k1}/${k2}`, v]));

      expect([key1, key2, value]).toEqual(['a', 'x', 1]);
      expect(asMap.get('a/x')).toBe(1);
    });

    it('iterates a snapshot, so writes during iteration are not visited', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      const seen: [string, string, number][] = [];
      for (const entry of map) {
        seen.push(entry);
        map.set(`k${entry[2]}`, 'added', entry[2] + 10);
      }

      expect(seen).toEqual([['a', 'x', 1]]);
      expect(map.size).toBe(2);
    });

    it('terminates after the last entry', () => {
      const map = new DuoMap<string, string, number>();
      map.set('a', 'x', 1);

      const iterator = map[Symbol.iterator]();

      expect(iterator.next()).toEqual({ value: ['a', 'x', 1], done: false });
      expect(iterator.next().done).toBe(true);
      expect(iterator.next().done).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Type parameters
  // ---------------------------------------------------------------------------
  describe('type parameters', () => {
    it('defaults all three parameters to any', () => {
      const map = new DuoMap();

      map.set('a', 1, true);

      expect(map.get('a', 1)).toBe(true);
    });

    it('keeps key types independent', () => {
      const map = new DuoMap<{ id: number }, symbol, string[]>();
      const key1 = { id: 1 };
      const key2 = Symbol('k');

      map.set(key1, key2, ['v']);

      expect(map.get(key1, key2)).toEqual(['v']);
      expect(map.get({ id: 1 }, key2)).toBeUndefined();
    });
  });
});
