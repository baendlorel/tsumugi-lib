import { describe, it, expect } from 'vitest';
import { UntypedWhether } from '../src/whether.js';

describe('UntypedWhether edge cases', () => {
  const whether = new UntypedWhether();
  it('cross-realm Array', () => {
    const fakeArray = Object.create(Array);
    const arr: any[] = [];
    Reflect.setPrototypeOf(arr, fakeArray);
    expect(whether.isArray(arr)).toBe(true);
  });

  it('cross-realm Date/RegExp', () => {
    const fakeDate = Object.create(Date.prototype);
    const fakeRegExp = Object.create(RegExp.prototype);
    expect(whether.likeDate(fakeDate)).toBe(true);
    expect(whether.likeRegExp(fakeRegExp)).toBe(true);
  });

  it('exotic objects', () => {
    const obj = Object.create(null);
    expect(whether.isPlainObject(obj)).toBe(true);
    expect(whether.isObject(obj)).toBe(true);
    expect(whether.isFunction(obj)).toBe(false);
  });

  it('proxy objects', () => {
    const arr = new Proxy([], {});
    expect(whether.isArray(arr)).toBe(true);
    const obj = new Proxy({}, {});
    expect(whether.isPlainObject(obj)).toBe(true);
  });

  it('empty', () => {
    expect(whether.isEmpty(false)).toBe(true);
    expect(whether.isEmpty(NaN)).toBe(true);
  });

  it('NaN edge', () => {
    expect(whether.isNaN(Number('foo'))).toBe(true);
    expect(whether.isNaN('foo')).toBe(null);
  });

  it('Set/Map with custom prototype', () => {
    class MySet extends Set {}
    class MyMap extends Map {}
    const mySet = new MySet();
    const myMap = new MyMap();
    expect(whether.likeSet(mySet)).toBe(true); // isSameProto should fail
    expect(whether.likeMap(myMap)).toBe(true);
  });

  it('WeakSet/WeakMap with custom prototype', () => {
    class MyWeakSet extends WeakSet {}
    class MyWeakMap extends WeakMap {}
    const myWeakSet = new MyWeakSet();
    const myWeakMap = new MyWeakMap();
    expect(whether.likeWeakSet(myWeakSet)).toBe(true);
    expect(whether.likeWeakMap(myWeakMap)).toBe(true);
  });

  it('Function with Symbol.hasInstance', () => {
    class Fake {}
    Object.defineProperty(Fake, Symbol.hasInstance, {
      value: () => true,
    });
    expect(whether.isClass(Fake)).toBe(true);
    expect(whether.isObject(Fake)).toBe(false);
  });

  it('Arrow function with bind', () => {
    const arrow = () => {};
    const bound = arrow.bind(null);
    expect(whether.isArrowFunction(bound)).toBe(true);
  });

  it('Array-like objects', () => {
    const arrayLike = { 0: 'a', 1: 'b', length: 2 };
    expect(whether.isArray(arrayLike)).toBe(false);
    expect(whether.isIterable(arrayLike)).toBe(false);
  });

  it('Symbol.iterator shadowed', () => {
    const obj = { [Symbol.iterator]: 123 };
    expect(whether.isIterable(obj)).toBe(false);
  });

  it('BigInt edge', () => {
    expect(whether.isBigInt(Object(BigInt(1)))).toBe(false);
  });

  it('isField/isPropertyKey with weird values', () => {
    expect(whether.isField(Object('a'))).toBe(false);
    expect(whether.isPropertyKey(Object(1))).toBe(false);
  });
});
