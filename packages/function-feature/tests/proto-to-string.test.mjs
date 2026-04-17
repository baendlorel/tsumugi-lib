import { describe, it, expect } from 'vitest';
import { protoToString } from '../lib/index.mjs';

describe('protoToString', () => {
  it('returns native toString for function', () => {
    function foo() {}
    const str = protoToString(foo);
    expect(str.startsWith('function foo')).toBe(true);
  });

  it('returns native toString for class', () => {
    class Bar {}
    const str = protoToString(Bar);
    expect(str.startsWith('class Bar')).toBe(true);
  });

  it('not affected by user override', () => {
    function baz() {}
    baz.toString = () => 'fake';
    const str = protoToString(baz);
    expect(str.startsWith('function baz')).toBe(true);
  });
});
