import type { Class, Func } from './global.js';
import { deepEqual } from './deep-equal.js';
import { getAllKeys } from './get-all-keys.js';
import {
  $is,
  $ObjectPrototype,
  $ownKeys,
  $get,
  $getPrototypeOf,
  $isArray,
  $isNaN,
  $isInt,
  $isSafeInt,
  $isFinite,
  $MAX_INT,
  $MIN_INT,
  $fnToString,
} from '@shared';

const NOT_GIVEN = Symbol('NOT_GIVEN');

export class UntypedWhether extends Function {
  constructor() {
    super('o', `return !!o`);
  }

  // #region Conceptional judge
  /**
   * Same as `Object.is`
   */
  is(a: any, b: any): boolean {
    return $is(a, b);
  }

  /**
   * Deepl equal
   * @param a
   * @param b
   */
  equal(a: any, b: any): boolean {
    return deepEqual(a, b, this.likeInstanceOf.bind(this));
  }

  /**
   * Check if the target is **not** one of `undefined`, `null`, `+0`, `-0`, `NaN`, `0`, or `''`
   * @param o target
   */
  isTruthy(o: any): boolean {
    return Boolean(o);
  }

  /**
   * Check if the target is one of `undefined`, `null`, `+0`, `-0`, `NaN`, `0`, or `''`
   * @param o target
   */
  isFalsy(o: any): boolean {
    return !o;
  }

  /**
   * Returns `true` if the target is falsy or `{}`, `[]`
   * @param o target
   */
  isEmpty(o: any): boolean {
    if (!o) {
      return true;
    }

    if ($isArray(o)) {
      return o.length === 0;
    }

    if (typeof o === 'object') {
      return $ownKeys(o).length === 0;
    }

    return false;
  }

  /**
   * Check if the target has no keys
   * - return `null` if the target is not an object
   */
  isEmptyObject(o: any): boolean | null {
    if (typeof o !== 'object') {
      return null;
    }
    return $ownKeys(o).length === 0;
  }

  /**
   * Check if the target is an empty array
   * - return `null` if the target is not an object
   */
  isEmptyArray(o: any): boolean | null {
    if (!$isArray(o)) {
      return null;
    }
    return o.length === 0;
  }

  /**
   * Tell whether the target is negative zero
   * @param o target
   */
  isNegativeZero(o: any): boolean {
    return $is(o, -0);
  }

  /**
   * Tell whether the target is positive zero
   * @param o target
   */
  isPositiveZero(o: any): boolean {
    return $is(o, +0);
  }

  /**
   * Check if the constructor of the target has the similar properties as the given constructor
   * - Will check all property keys in the proto chain, and compare their `typeof o[key]`
   * @param protoClass
   * @param o
   * @returns
   */
  likeInstanceOf<T extends Class>(protoClass: T, o: any): o is InstanceType<T> {
    if (o instanceof protoClass) {
      return true;
    }

    if (!this.isObject(o)) {
      return false;
    }

    let example;
    if ($is(protoClass, Promise)) {
      example = new protoClass(() => ({}));
    } else {
      example = new protoClass();
    }

    const protoKeys = [...getAllKeys(example)];
    const targetProtoKeys = getAllKeys(o);
    if (protoKeys.length > targetProtoKeys.size) {
      return false;
    }

    for (let i = 0; i < protoKeys.length; i++) {
      const k = protoKeys[i];
      if (!targetProtoKeys.has(k)) {
        return false;
      }
      if (typeof $get(o, k) !== typeof example[k]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Tell whether the target is like an `Error` instance
   * - If the target is an instanceof `Error`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * @param o target
   */
  likeError(o: any): o is Error {
    return this.likeInstanceOf(Error, o);
  }

  /**
   * Tell whether the target is like a `Date` instance
   * - If the target is an instanceof `Date`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * @param o target
   */
  likeDate(o: any): o is Date {
    return this.likeInstanceOf(Date, o);
  }

  /**
   * Tell whether the target is like a `Promise`
   * - If the target is an instanceof `Promise`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * @param o target
   */
  likePromise<T = any>(o: any): o is Promise<T> {
    return this.likeInstanceOf(Promise, o);
  }

  /**
   * Tell whether the target is like a `Set`
   * - If the target is an instanceof `Set`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * @param o target
   */
  likeSet<T = any>(o: any): o is Set<T> {
    return this.likeInstanceOf(Set, o) && this.isIterable(o);
  }

  /**
   * Tell whether the target is like a `Map`
   * - If the target is an instanceof `Map`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * @param o target
   */
  likeMap<K = any, V = any>(o: any): o is Map<K, V> {
    return this.likeInstanceOf(Map, o) && this.isIterable(o);
  }

  /**
   * Tell whether the target is like a `WeakSet`
   * - If the target is an instanceof `WeakSet`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * - `likeWeakSet(Set)` is  **true !**
   * @param o target
   */
  likeWeakSet<T extends WeakKey>(o: any): o is WeakSet<T> {
    return this.likeInstanceOf(WeakSet, o);
  }

  /**
   * Tell whether the target is like a `WeakMap`
   * - If the target is an instanceof `WeakMap`, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same `typeof`.
   * - `likeWeakMap(Map)` is  **true !**
   * @param o target
   */
  likeWeakMap<K extends WeakKey, V = any>(o: any): o is WeakMap<K, V> {
    return this.likeInstanceOf(WeakMap, o);
  }

  /**
   * Tell whether the target is iterable
   * @param o target
   */
  isIterable(o: any): o is Iterable<any> {
    if (o === null || o === undefined) {
      return false;
    }
    return typeof o[Symbol.iterator] === 'function';
  }

  /**
   * Tell whether the target is a plain object (created by {} or new Object)
   * @param o target
   */
  isPlainObject(o: any): o is object {
    if (!this.isObject(o)) {
      return false;
    }
    const proto = $getPrototypeOf(o);
    return proto === $ObjectPrototype || proto === null;
  }

  /**
   * Tell whether the target is like a RegExp instance
   * - If the target is an instanceof RegExp, returns true immediately.
   * - Otherwise, checks if all property keys in the prototype chain have the same typeof.
   * @param o target
   */
  likeRegExp(o: any): o is RegExp {
    return this.likeInstanceOf(RegExp, o);
  }

  /**
   * Tell whether the target is Promise-like
   *
   * Checks if the target is an object or function and has a 'then' method which is a function.
   * @param o target
   */
  isPromiseLike<T = any>(o: any): o is PromiseLike<T> {
    if (!this.likeObject<{ then: Func }>(o)) {
      return false;
    }

    if (o instanceof Promise) {
      return true;
    }

    return typeof o.then === 'function';
  }
  // #endregion

  // #region Normal judge

  /**
   * Tell whether the target is a non-null object
   * @param o target
   */
  isObject<T extends object>(o: any): o is T {
    return typeof o === 'object' && o !== null;
  }

  /**
   * Tell whether the target is a non-null object or a function
   * @param o target
   */
  likeObject<T extends object | Func>(o: unknown): o is T {
    return (typeof o === 'object' && o !== null) || typeof o === 'function';
  }

  /**
   * Tell whether the target is a function
   * @param o target
   */
  isFunction(o: any): o is Func {
    return typeof o === 'function';
  }

  /**
   * Tell whether the target is a string
   * @param o target
   */
  isString(o: any): o is string {
    return typeof o === 'string';
  }

  /**
   * Tell whether the target is a number
   * @param o target
   */
  isNumber(o: any): o is number {
    return typeof o === 'number';
  }

  /**
   * Tell whether the target is a boolean
   * @param o target
   */
  isBoolean(o: any): o is boolean {
    return typeof o === 'boolean';
  }

  /**
   * Tell whether the target is undefined
   * @param o target
   */
  isUndefined(o: any): o is undefined {
    return typeof o === 'undefined';
  }

  /**
   * Tell whether the target is null
   * @param o target
   */
  isNull(o: any): o is null {
    return o === null;
  }

  /**
   * Tell whether the target is a symbol
   * @param o target
   */
  isSymbol(o: any): o is symbol {
    return typeof o === 'symbol';
  }

  /**
   * Tell whether the target is a bigint
   * @param o target
   */
  isBigInt(o: any): o is bigint {
    return typeof o === 'bigint';
  }

  /**
   * Tell whether the target is null or undefined
   * @param o target
   */
  isNullish(o: any): o is null | undefined {
    return o === null || o === undefined;
  }

  /**
   * Tell whether the target is a primitive value
   * @param o target
   */
  isPrimitive(o: any): o is string | number | boolean | null | undefined | symbol | bigint {
    const t = typeof o;
    return (
      t === 'string' ||
      t === 'number' ||
      t === 'boolean' ||
      t === 'undefined' ||
      t === 'symbol' ||
      t === 'bigint' ||
      o === null
    );
  }

  /**
   * Tell whether the target is a field key (string or symbol)
   * @param o target
   */
  isField(o: unknown): o is string | symbol {
    return typeof o === 'string' || typeof o === 'symbol';
  }

  /**
   * Tell whether the target is a property key (string, symbol or number)
   * @param o target
   */
  isPropertyKey(o: unknown): o is string | symbol | number {
    return typeof o === 'string' || typeof o === 'symbol' || typeof o === 'number';
  }

  /**
   * Tell whether the target is NaN
   * - **if target is not a number, it will return `null`**
   * - if target is a number, it will return `true` if it is `NaN`
   * @param o target
   */
  isNaN(o: any): boolean | null {
    if (typeof o !== 'number') {
      return null;
    }

    return $isNaN(o);
  }

  /**
   * Tell whether the target is an integer
   * @param o target
   */
  isInteger(o: any): boolean {
    return $isInt(o);
  }

  /**
   * Tell whether the target is a safe integer
   * @param o target
   */
  isSafeInteger(o: any): boolean {
    return $isSafeInt(o);
  }

  /**
   * Tell whether the target is a safe number
   * @param o target
   */
  isSafeNumber(o: any): boolean {
    return typeof o === 'number' && o <= $MAX_INT && o >= $MIN_INT;
  }

  isFinite(o: any): boolean {
    return $isFinite(o);
  }

  /**
   * Tell whether the target is a class constructor
   * - use proxy to check if the target is constructable
   * - then see if `target.toString()` starts with `class` or `[class`(sometimes in node)
   * - cannot tell after `.bind()` or Proxied the apply behavior of a class
   * @see For precise results, see https://github.com/baendlorel/get-function-features
   * @param o target
   */
  isClass(o: any): o is Class {
    if (typeof o !== 'function') {
      return false;
    }
    try {
      const psudo = new Proxy(o, { construct: () => ({}) });
      new psudo();
      const str = $fnToString.call(o) as string;
      const trimmed = str.replace(/\s/g, '');
      return trimmed.startsWith('class') || trimmed.startsWith('[class');
    } catch {
      return false;
    }
  }

  /**
   * Asserts that `arr` is an array.
   * - If `predicate` is provided, it will be called for each element in the array.
   *   - If it returns a string, it will throw an error with that message.
   *   - If it returns `null` or `undefined`, the element is considered valid.
   *   - If it returns `boolean` and value is `true`, the element is considered valid.
   * @param o target array
   * @param predicate function to validate each element
   * @param msg
   */
  isArray<T = any>(o: any, predicate?: (value?: T, index?: number, array?: T[]) => string | boolean): o is T[] {
    if (!$isArray(o)) {
      return false;
    }

    if (!predicate) {
      return true;
    }

    if (typeof predicate !== 'function') {
      throw new Error('`predicate` must be a function');
    }

    for (let i = 0; i < o.length; i++) {
      const result = predicate(o[i], i, o);
      if (result === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Tell whether the target is like `(...) => any`
   * - Might be not so accurate under some extreme circumstances like bound functions or proxied functions, etc.
   *   - So we just don't allow such cases.
   * @see For precise results, see https://github.com/baendlorel/get-function-features
   */
  isArrowFunction(o: any): o is Func {
    if (typeof o !== 'function') {
      return false;
    }

    try {
      const psudo = new Proxy(o, { construct: () => ({}) });
      new psudo();
      return false;
    } catch {
      return true;
    }
  }
  // #endregion

  // #region Can be undefined
  /**
   * (Optional) Tell whether the target is negative zero
   * @param o target
   */
  orNegativeZero(o: any): boolean {
    return o === undefined || this.isNegativeZero(o);
  }

  /**
   * (Optional) Tell whether the target is positive zero
   * @param o target
   */
  orPositiveZero(o: any): boolean {
    return o === undefined || this.isPositiveZero(o);
  }

  /**
   * (Optional) Tell whether the target is a function
   * @param o target
   */
  orFunction(o: any): o is Func | undefined {
    return o === undefined || this.isFunction(o);
  }

  /**
   * (Optional) Tell whether the target is a non-null object
   * @param o target
   */
  orObject<T extends object>(o: any): o is T | undefined {
    return o === undefined || this.isObject(o);
  }

  /**
   * (Optional) Tell whether the target is a non-null object or a function
   * @param o target
   */
  orLikeObject(o: unknown) {
    return o === undefined || this.likeObject(o);
  }

  /**
   * (Optional) Tell whether the target is a string
   * @param o target
   */
  orString(o: any): o is string | undefined {
    return o === undefined || this.isString(o);
  }

  /**
   * (Optional) Tell whether the target is a number
   * @param o target
   */
  orNumber(o: any): o is number | undefined {
    return o === undefined || this.isNumber(o);
  }

  /**
   * (Optional) Tell whether the target is a boolean
   * @param o target
   */
  orBoolean(o: any): o is boolean | undefined {
    return o === undefined || this.isBoolean(o);
  }

  /**
   * (Optional) Tell whether the target is undefined
   * @param o target
   */
  orUndefined(o: any): o is undefined {
    return o === undefined || this.isUndefined(o);
  }

  /**
   * (Optional) Tell whether the target is null
   * @param o target
   */
  orNull(o: any): o is null | undefined {
    return o === undefined || this.isNull(o);
  }

  /**
   * (Optional) Tell whether the target is a symbol
   * @param o target
   */
  orSymbol(o: any): o is symbol | undefined {
    return o === undefined || this.isSymbol(o);
  }

  /**
   * (Optional) Tell whether the target is a bigint
   * @param o target
   */
  orBigInt(o: any): o is bigint | undefined {
    return o === undefined || this.isBigInt(o);
  }

  /**
   * (Optional) Tell whether the target is a field key (string or symbol)
   * @param o target
   */
  orField(o: unknown): o is string | symbol | undefined {
    return o === undefined || this.isField(o);
  }

  /**
   * (Optional) Tell whether the target is a property key (string, symbol or number)
   * @param o target
   */
  orPropertyKey(o: unknown): o is string | symbol | number | undefined {
    return o === undefined || this.isPropertyKey(o);
  }

  /**
   * (Optional) Tell whether the target is NaN
   * @param o target
   */
  orNaN(o: any): boolean | null {
    return o === undefined || this.isNaN(o);
  }

  /**
   * (Optional) Tell whether the target is an integer
   * @param o target
   */
  orInteger(o: any): boolean {
    return o === undefined || this.isInteger(o);
  }

  /**
   * (Optional) Tell whether the target is a safe integer
   * @param o target
   */
  orSafeInteger(o: any): boolean {
    return o === undefined || this.isSafeInteger(o);
  }

  /**
   * (Optional) Tell whether the target is a safe number
   * @param o target
   */
  orSafeNumber(o: any): boolean {
    return o === undefined || this.isSafeNumber(o);
  }

  /**
   * (Optional) Tell whether the target is a class constructor
   * @param o target
   */
  orClass(o: any): o is Class | undefined {
    return o === undefined || this.isClass(o);
  }

  /**
   * (Optional) Tell whether the target is an array
   * @param o target array
   * @param predicate function to validate each element
   */
  orArray<T = any>(
    o: any,
    predicate: (value?: T, index?: number, array?: T[]) => string | boolean = NOT_GIVEN as any,
  ): o is T[] | undefined {
    return o === undefined || this.isArray(o, predicate);
  }
  // #endregion
}
