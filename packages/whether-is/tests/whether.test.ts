import { describe, expect, it } from 'vitest';
import { UntypedWhether } from '../src/whether.js';

describe('UntypedWhether', () => {
  const whether = new UntypedWhether();

  it('isTruthy & isFalsy', () => {
    expect(whether.isTruthy(1)).toBe(true);
    expect(whether.isTruthy('a')).toBe(true);
    expect(whether.isTruthy([])).toBe(true);
    expect(whether.isTruthy({})).toBe(true);
    expect(whether.isTruthy(0)).toBe(false);
    expect(whether.isTruthy('')).toBe(false);
    expect(whether.isTruthy(null)).toBe(false);
    expect(whether.isTruthy(undefined)).toBe(false);
    expect(whether.isFalsy(0)).toBe(true);
    expect(whether.isFalsy('')).toBe(true);
    expect(whether.isFalsy(false)).toBe(true);
    expect(whether.isFalsy([])).toBe(false);
  });

  it('isEmpty', () => {
    expect(whether.isEmpty('')).toBe(true);
    expect(whether.isEmpty([])).toBe(true);
    expect(whether.isEmpty({})).toBe(true);
    expect(whether.isEmpty([1])).toBe(false);
    expect(whether.isEmpty({ a: 1 })).toBe(false);
    expect(whether.isEmpty(0)).toBe(true);
    expect(whether.isEmpty(null)).toBe(true);
  });

  it('isEmptyObject', () => {
    expect(whether.isEmptyObject({})).toBe(true);
    expect(whether.isEmptyObject({ a: 1 })).toBe(false);
    expect(whether.isEmptyObject([])).toBe(false);
    expect(whether.isEmptyObject('str')).toBe(null);
  });

  it('isEmptyArray', () => {
    expect(whether.isEmptyArray([])).toBe(true);
    expect(whether.isEmptyArray([1])).toBe(false);
    expect(whether.isEmptyArray({})).toBe(null);
  });

  it('isNegativeZero & isPositiveZero', () => {
    expect(whether.isNegativeZero(-0)).toBe(true);
    expect(whether.isNegativeZero(0)).toBe(false);
    expect(whether.isPositiveZero(0)).toBe(true);
    expect(whether.isPositiveZero(-0)).toBe(false);
  });

  it('likeError', () => {
    expect(whether.likeError(new Error())).toBe(true);
    expect(whether.likeError(new TypeError())).toBe(true);
    expect(whether.likeError({})).toBe(false);
  });

  it('likeDate', () => {
    expect(whether.likeDate(new Date())).toBe(true);
    expect(whether.likeDate(Date.now())).toBe(false);
  });

  it('likePromise', () => {
    expect(whether.likePromise(Promise.resolve())).toBe(true);
    expect(whether.likePromise({ then: () => {}, catch: () => {} })).toBe(false);
  });

  it('likeSet', () => {
    expect(whether.likeSet(new Set())).toBe(true);
    expect(whether.likeSet([])).toBe(false);
  });

  it('likeMap', () => {
    expect(whether.likeMap(new Map())).toBe(true);
    expect(whether.likeMap({})).toBe(false);
  });

  it('likeWeakSet', () => {
    expect(whether.likeWeakSet(new WeakSet())).toBe(true);
    expect(whether.likeWeakSet(new Set())).toBe(true);
  });

  it('likeWeakMap', () => {
    expect(whether.likeWeakMap(new WeakMap())).toBe(true);
    expect(whether.likeWeakMap(new Map())).toBe(true);
  });

  it('isIterable', () => {
    expect(whether.isIterable([])).toBe(true);
    expect(whether.isIterable('abc')).toBe(true);
    expect(whether.isIterable(new Set())).toBe(true);
    expect(whether.isIterable({})).toBe(false);
  });

  it('isPlainObject', () => {
    expect(whether.isPlainObject({})).toBe(true);
    expect(whether.isPlainObject(Object.create(null))).toBe(true);
    expect(whether.isPlainObject([])).toBe(false);
    expect(whether.isPlainObject(new (class {})())).toBe(false);
  });

  it('likeRegExp', () => {
    expect(whether.likeRegExp(/abc/)).toBe(true);
    expect(whether.likeRegExp(new RegExp('abc'))).toBe(true);
    expect(whether.likeRegExp('abc')).toBe(false);
  });

  it('isObject', () => {
    expect(whether.isObject({})).toBe(true);
    expect(whether.isObject([])).toBe(true);
    expect(whether.isObject(null)).toBe(false);
    expect(whether.isObject(1)).toBe(false);
  });

  it('likeObject', () => {
    expect(whether.likeObject({})).toBe(true);
    expect(whether.likeObject(() => {})).toBe(true);
    expect(whether.likeObject(null)).toBe(false);
    expect(whether.likeObject(1)).toBe(false);
  });

  it('isFunction', () => {
    expect(whether.isFunction(() => {})).toBe(true);
    expect(whether.isFunction(function () {})).toBe(true);
    expect(whether.isFunction({})).toBe(false);
  });

  it('isString', () => {
    expect(whether.isString('abc')).toBe(true);
    expect(whether.isString(123)).toBe(false);
  });

  it('isNumber', () => {
    expect(whether.isNumber(123)).toBe(true);
    expect(whether.isNumber('123')).toBe(false);
  });

  it('isBoolean', () => {
    expect(whether.isBoolean(true)).toBe(true);
    expect(whether.isBoolean(false)).toBe(true);
    expect(whether.isBoolean(0)).toBe(false);
  });

  it('isUndefined', () => {
    expect(whether.isUndefined(undefined)).toBe(true);
    expect(whether.isUndefined(null)).toBe(false);
  });

  it('isNull', () => {
    expect(whether.isNull(null)).toBe(true);
    expect(whether.isNull(undefined)).toBe(false);
  });

  it('isSymbol', () => {
    expect(whether.isSymbol(Symbol())).toBe(true);
    expect(whether.isSymbol('symbol')).toBe(false);
  });

  it('isBigInt', () => {
    expect(whether.isBigInt(BigInt(1))).toBe(true);
    expect(whether.isBigInt(1)).toBe(false);
  });

  it('isNullish', () => {
    expect(whether.isNullish(null)).toBe(true);
    expect(whether.isNullish(undefined)).toBe(true);
    expect(whether.isNullish(0)).toBe(false);
  });

  it('isPrimitive', () => {
    expect(whether.isPrimitive(1)).toBe(true);
    expect(whether.isPrimitive('a')).toBe(true);
    expect(whether.isPrimitive(false)).toBe(true);
    expect(whether.isPrimitive(null)).toBe(true);
    expect(whether.isPrimitive(undefined)).toBe(true);
    expect(whether.isPrimitive(Symbol())).toBe(true);
    expect(whether.isPrimitive(BigInt(1))).toBe(true);
    expect(whether.isPrimitive({})).toBe(false);
  });

  it('isField', () => {
    expect(whether.isField('a')).toBe(true);
    expect(whether.isField(Symbol())).toBe(true);
    expect(whether.isField(1)).toBe(false);
  });

  it('isPropertyKey', () => {
    expect(whether.isPropertyKey('a')).toBe(true);
    expect(whether.isPropertyKey(Symbol())).toBe(true);
    expect(whether.isPropertyKey(1)).toBe(true);
    expect(whether.isPropertyKey({})).toBe(false);
  });

  it('isNaN', () => {
    expect(whether.isNaN(NaN)).toBe(true);
    expect(whether.isNaN(1)).toBe(false);
    expect(whether.isNaN('a')).toBe(null);
  });

  it('isInteger', () => {
    expect(whether.isInteger(1)).toBe(true);
    expect(whether.isInteger(1.1)).toBe(false);
    expect(whether.isInteger('1')).toBe(false);
  });

  it('isSafeInteger', () => {
    expect(whether.isSafeInteger(1)).toBe(true);
    expect(whether.isSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(whether.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });

  it('isSafeNumber', () => {
    expect(whether.isSafeNumber(1)).toBe(true);
    expect(whether.isSafeNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(whether.isSafeNumber(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(whether.isSafeNumber('1')).toBe(false);
  });

  it('isFinite', () => {
    expect(whether.isFinite(1)).toBe(true);
    expect(whether.isFinite(Infinity)).toBe(false);
    expect(whether.isFinite(NaN)).toBe(false);
    expect(whether.isFinite('1')).toBe(false);
  });

  it('isClass', () => {
    class A {}
    function B() {}
    expect(whether.isClass(A)).toBe(true);
    expect(whether.isClass(B)).toBe(false);
    expect(whether.isClass({})).toBe(false);
  });

  it('isArray', () => {
    expect(whether.isArray([])).toBe(true);
    expect(whether.isArray([1, 2, 3])).toBe(true);
    expect(whether.isArray('abc')).toBe(false);
    expect(whether.isArray({}, () => true)).toBe(false);
    expect(whether.isArray([1, 2, 3], (v) => typeof v === 'number')).toBe(true);
    expect(whether.isArray([1, 'a', 3], (v) => typeof v === 'number')).toBe(false);
  });

  it('isArrowFunction', () => {
    const arrow = () => {};
    function normal() {}
    expect(whether.isArrowFunction(arrow)).toBe(true);
    expect(whether.isArrowFunction(normal)).toBe(false);
  });
});
