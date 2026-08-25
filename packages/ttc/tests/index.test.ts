import { describe, it, expect } from 'vitest';
import { toAssigned } from '../src';

describe('toAssigned', () => {
  it('returns an empty plain object when no valid source is provided', () => {
    expect(toAssigned()).toEqual({});
    expect(toAssigned(null, undefined, 1, 'x', true, () => {})).toEqual({});
    expect(Object.getPrototypeOf(toAssigned())).toBe(Object.prototype);
  });

  it('copies enumerable own properties from a single object', () => {
    const obj = { a: 1, b: 2 };
    expect(toAssigned(obj)).toEqual({ a: 1, b: 2 });
  });

  it('merges multiple sources and later sources overwrite earlier keys', () => {
    const a = { x: 1, y: 2 };
    const b = { y: 3, z: 4 };
    expect(toAssigned(a, b)).toEqual({ x: 1, y: 3, z: 4 });
  });

  it('always returns a plain object target', () => {
    const proto = { fromProto: 1 };
    const src = Object.create(proto);
    src.own = 2;

    const result = toAssigned(src);
    expect(result).toEqual({ own: 2 });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('ignores non-object sources (including functions)', () => {
    const fn = () => 1;
    const result = toAssigned({ a: 1 }, fn, null, 0, '', false, undefined);
    expect(result).toEqual({ a: 1 });
  });

  it('copies only enumerable keys', () => {
    const obj = {} as any;
    Object.defineProperty(obj, 'hidden', { value: 42, enumerable: false });
    obj.visible = 7;
    expect(toAssigned(obj)).toEqual({ visible: 7 });
  });

  it('copies enumerable symbol keys', () => {
    const sym = Symbol('s');
    const obj = { [sym]: 1 };
    const result = toAssigned(obj);
    expect(result[sym]).toBe(1);
    expect(Reflect.ownKeys(result)).toContain(sym);
  });

  it('does not mutate source objects', () => {
    const a = { x: 1 } as any;
    const b = { y: 2 };
    const out = toAssigned(a, b);

    expect(out).toEqual({ x: 1, y: 2 });
    expect(out).not.toBe(a);
    expect(out).not.toBe(b);

    out.x = 99;
    toAssigned(a, b);
    expect(a).toEqual({ x: 1 });
    expect(b).toEqual({ y: 2 });
  });

  it('evaluates getters during copy', () => {
    const obj = {
      get foo() {
        return 123;
      },
      bar: 456,
    };

    const result = toAssigned(obj);
    expect(result).toHaveProperty('foo', 123);
    expect(result).toHaveProperty('bar', 456);
  });

  it('handles arrays as object sources (not as array output)', () => {
    const result = toAssigned([1, 2, 3]);
    expect(result).toEqual({ 0: 1, 1: 2, 2: 3 });
    expect(Array.isArray(result)).toBe(false);
  });

  it('handles null-prototype objects as sources', () => {
    const obj = Object.create(null);
    obj.x = 1;
    expect(toAssigned(obj)).toEqual({ x: 1 });
  });
});
