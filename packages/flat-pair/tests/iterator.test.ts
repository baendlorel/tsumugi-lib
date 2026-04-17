import { expect, describe, it } from 'vitest';
import { FlatPair } from '../src/index.js';

describe('Iterators and at()', () => {
  it('keys(), values(), entries() and default iterator (entries) work as expected', () => {
    const fp = new FlatPair(['k1', 'v1', 'k2', 'v2']);

    expect([...fp.keys()]).toEqual(['k1', 'k2']);
    expect([...fp.values()]).toEqual(['v1', 'v2']);
    expect([...fp.entries()]).toEqual([
      ['k1', 'v1'],
      ['k2', 'v2'],
    ]);

    // default iterator should iterate entries
    expect([...fp]).toEqual([
      ['k1', 'v1'],
      ['k2', 'v2'],
    ]);

    // use keys in for..of
    const keys: any[] = [];
    for (const k of fp.keys()) {
      keys.push(k);
    }
    expect(keys).toEqual(['k1', 'k2']);
  });
});
