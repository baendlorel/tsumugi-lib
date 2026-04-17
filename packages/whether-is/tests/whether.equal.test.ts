import { describe, it, expect } from 'vitest';
import { UntypedWhether } from '../src/whether.js';

describe('whether.equal', () => {
  const whether = new UntypedWhether();
  const equal = whether.equal.bind(whether);

  it('should return true for primitives with same value', () => {
    expect(equal(1, 1)).toBe(true);
    expect(equal('a', 'a')).toBe(true);
    expect(equal(true, true)).toBe(true);
    expect(equal(null, null)).toBe(true);
    expect(equal(undefined, undefined)).toBe(true);
    expect(equal(NaN, NaN)).toBe(true);
    expect(equal(+0, +0)).toBe(true);
    expect(equal(-0, -0)).toBe(true);
  });

  it('should return false for primitives with different value', () => {
    expect(equal(1, 2)).toBe(false);
    expect(equal('a', 'b')).toBe(false);
    expect(equal(true, false)).toBe(false);
    expect(equal(null, undefined)).toBe(false);
    expect(equal(+0, -0)).toBe(false);
  });

  it('should compare arrays deeply', () => {
    expect(equal([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(equal([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(equal([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(equal([1, [2, 3]], [1, [3, 2]])).toBe(false);
  });

  it('should compare objects deeply', () => {
    expect(equal({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(equal({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(equal({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(equal({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
    expect(equal({ a: { b: 2 } }, { a: { b: 3 } })).toBe(false);
  });

  it('should compare Date objects by time', () => {
    expect(equal(new Date(123), new Date(123))).toBe(true);
    expect(equal(new Date(123), new Date(456))).toBe(false);
  });

  it('should compare RegExp objects by source and flags', () => {
    expect(equal(/abc/gi, /abc/gi)).toBe(true);
    expect(equal(/abc/g, /abc/i)).toBe(false);
    expect(equal(/abc/g, /def/g)).toBe(false);
  });

  it('should compare Map objects deeply', () => {
    const m1 = new Map([
      [1, 'a'],
      [2, 'b'],
    ]);
    const m2 = new Map([
      [1, 'a'],
      [2, 'b'],
    ]);
    const m3 = new Map([
      [2, 'b'],
      [1, 'a'],
    ]);
    const m4 = new Map([
      [1, 'a'],
      [2, 'c'],
    ]);
    expect(equal(m1, m2)).toBe(true);
    expect(equal(m1, m3)).toBe(true); // Map order doesn't matter
    expect(equal(m1, m4)).toBe(false);
  });

  it('should compare Set objects deeply', () => {
    const s1 = new Set([1, 2, 3]);
    const s2 = new Set([3, 2, 1]);
    const s3 = new Set([1, 2]);
    expect(equal(s1, s2)).toBe(true);
    expect(equal(s1, s3)).toBe(false);
  });

  it('should handle objects with symbol keys', () => {
    const sym = Symbol('x');
    expect(equal({ [sym]: 1 }, { [sym]: 1 })).toBe(true);
    expect(equal({ [sym]: 1 }, { [sym]: 2 })).toBe(false);
  });

  it('should handle nested structures', () => {
    const a = { x: [1, { y: new Set([2, 3]) }], z: new Map([[1, { b: 2 }]]) };
    const b = { x: [1, { y: new Set([3, 2]) }], z: new Map([[1, { b: 2 }]]) };
    expect(equal(a, b)).toBe(true);
  });

  it('should return false for different types', () => {
    expect(equal(1, '1')).toBe(false);
    expect(equal([], {})).toBe(false);
    expect(equal(new Date(), {})).toBe(false);
    expect(equal(new Set(), new Map())).toBe(false);
  });

  it('should handle null and undefined', () => {
    expect(equal(null, undefined)).toBe(false);
    expect(equal(undefined, undefined)).toBe(true);
    expect(equal(null, null)).toBe(true);
  });

  it('should handle objects with different ownKeys', () => {
    expect(equal({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(equal([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should handle circular references', () => {
    const a: any = { foo: 1 };
    const b: any = { foo: 1 };
    b.self = a;
    a.self = b;
    expect(() => equal(a, b));
  });
});
