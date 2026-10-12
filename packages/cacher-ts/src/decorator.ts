import { Cacher } from './cacher.js';

/**
 * Caches the result of a no-argument method.
 *
 * **You must handle errors in your method**.
 *
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(ttl: number) {
  return function (target: (...args: any[]) => any, context: ClassMethodDecoratorContext) {
    if (target.length !== 0) {
      throw new TypeError(
        `@Cache() only decorates a method that takes no parameters, but "${String(context.name)}" declares ${target.length}.`,
      );
    }

    const map = new WeakMap<any, Cacher>();
    return function (this: any) {
      let c = map.get(this);
      if (!c) {
        map.set(this, (c = new Cacher(target, ttl)));
      }
      return c.isInitialized ? c.get() : c.reload(this);
    };
  };
}
