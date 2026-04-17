import { describe, it, expect } from 'vitest';
import {
  size,
  add,
  has,
  hasByValue,
  get,
  getByValue,
  remove,
  removeByValue,
  forEach,
  clear,
  find,
  findIndex,
} from '../src/operators.js';

describe('operators', () => {
  it('size returns pair count and throws on odd length', () => {
    expect(size(['a', 1, 'b', 2])).toBe(2);
    expect(() => size(['a', 1, 'b'])).toThrow(/Invalid length/);
  });

  it('add appends pair and avoids duplicates', () => {
    const items: any[] = [];
    add(items, 'k1', 'v1');
    add(items, 'k2', 'v2');
    expect(items).toEqual(['k1', 'v1', 'k2', 'v2']);

    add(items, 'k1', 'new');
    // original preserved
    expect(items).toEqual(['k1', 'v1', 'k2', 'v2']);
  });

  it('has / hasByValue / get / getByValue work', () => {
    const items = ['x', 'X', 'y', 'Y'];
    expect(has(items, 'x')).toBe(true);
    expect(has(items, 'nope')).toBe(false);
    expect(hasByValue(items, 'Y')).toBe(true);
    expect(hasByValue(items, 'none')).toBe(false);

    expect(get(items, 'x')).toBe('X');
    expect(get(items, 'y')).toBe('Y');
    expect(get(items, 'z')).toBeUndefined();

    expect(getByValue(items, 'X')).toBe('x');
    expect(getByValue(items, 'Y')).toBe('y');
    expect(getByValue(items, 'Z')).toBeUndefined();
  });

  it('remove / removeByValue remove first matching pair and return boolean', () => {
    const items = ['a', 'A', 'b', 'B', 'c', 'C'];
    expect(remove(items, 'b')).toBe(true);
    expect(items).toEqual(['a', 'A', 'c', 'C']);
    expect(remove(items, 'missing')).toBe(false);

    expect(removeByValue(items, 'C')).toBe(true);
    expect(items).toEqual(['a', 'A']);
    expect(removeByValue(items, 'nope')).toBe(false);
  });

  it('forEach iterates over pairs with correct args and thisArg', () => {
    const items = ['k1', 'v1', 'k2', 'v2'];
    const calls: any[] = [];
    const thisArg = { marker: true };
    forEach(
      items,
      function (this: any, value, key, index, arr) {
        calls.push({ value, key, index, arr, thisMarker: this.marker });
      },
      thisArg,
    );

    expect(calls.length).toBe(2);
    expect(calls[0]).toEqual({ value: 'v1', key: 'k1', index: 0, arr: items, thisMarker: true });
    expect(calls[1].value).toBe('v2');
  });

  it('clear empties the array', () => {
    const items = ['one', 1];
    clear(items);
    expect(items).toEqual([]);
  });

  it('find and findIndex with predicate work (predicate sees value,key,index,array)', () => {
    const items = ['k1', 'v1', 'k2', 'v2', 'k3', 'v3'];

    const pair = find(items, (value, key, index, arr) => value === 'v2');
    expect(pair).toEqual(['k2', 'v2']);

    const idx = findIndex(items, (value) => value === 'v3');
    expect(idx).toBe(4);

    const notFound = find(items, () => false);
    expect(notFound).toBeUndefined();

    const notFoundIdx = findIndex(items, () => false);
    expect(notFoundIdx).toBe(-1);
  });
});
