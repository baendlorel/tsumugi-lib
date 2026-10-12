import { Cacher } from './cacher.js';
import { empty, isPromiseLike } from './common.js';

type MethodDecorator = (target: (...args: any[]) => any, context: ClassMethodDecoratorContext) => (this: any) => any;

const cacheMap = new WeakMap<any, WeakMap<any, Map<string | symbol, Cacher>>>();

/**
 * Caches the result of a no-argument method.
 * **You must handle errors in your method**.
 * @param key The key for the cached method, can be visited in `@SubCache`.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(key: string, ttl?: number): MethodDecorator;
/**
 * Caches the result of a no-argument method.
 * **You must handle errors in your method**.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(ttl?: number): MethodDecorator;
export function Cache(...args: any[]) {
  return function (target: (...args: any[]) => any, context: ClassMethodDecoratorContext) {
    if (target.length !== 0) {
      throw new TypeError(
        `@Cache() only decorates a method that takes no parameters, but "${String(context.name)}" declares ${target.length}.`,
      );
    }

    // # check params
    let key = context.name;
    let ttl = Infinity;
    if (args.length === 1) {
      if (typeof args[0] === 'string') {
        key = args[0];
      } else if (typeof args[0] === 'number') {
        ttl = args[0];
      } else {
        throw new TypeError(`@Cache expects 1st arg to be string | number, got ${typeof args[0]}.`);
      }
    } else if (args.length === 2) {
      key = args[0];
      ttl = args[1];
      if (typeof key !== 'string') {
        throw new TypeError(`@Cache expects 1st arg to be string, got ${typeof args[0]}.`);
      }
      if (typeof ttl !== 'number') {
        throw new TypeError(`@Cache expects 2nd arg to be number, got ${typeof ttl}.`);
      }
    }
    if (Number.isNaN(ttl)) {
      console.warn(`Assign 'NaN' to ttl might not be a wise choice.`);
    }

    const map = new WeakMap<any, Map<string | symbol, Cacher>>();
    return function (this: any) {
      let cMap = map.get(this);
      if (!cMap) {
        map.set(this, (cMap = new Map<string | symbol, Cacher>()));
        cMap.set(key, new Cacher(target, ttl).setThis(this));
        cacheMap.set(this, map);
      }

      const c = cMap.get(key)!;
      return c.isInitialized ? c.get() : c.reload();
    };
  };
}

export function SubCache(key: string) {
  return function (target: (...args: any[]) => any, _context: ClassMethodDecoratorContext) {
    return function (this: any) {
      const c = cacheMap.get(this)?.get(this)?.get(key);
      if (!c) {
        throw new Error(`@SubCache cannot find Cacher instance for key "${key}".`);
      }
      if (!c.hasSub(key)) {
        c.derive(key, target);
      }

      if (c.isInitialized) {
        return c.getSub(key);
      }

      const v = c.reload();
      return isPromiseLike(v) ? v.then(() => c.getSub(key)) : c.getSub(key);
    };
  };
}
