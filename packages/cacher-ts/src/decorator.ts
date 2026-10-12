import { Cacher } from './cacher.js';

/**
 * The shape `@NoArgCache()` accepts: a method taking no parameters, returning the
 * value itself or a thenable for it.
 */
type NoArgMethod<T> = (this: any) => T | PromiseLike<T>;

/**
 * Caches the result of a no-argument method.
 *
 * **You must handle errors in your method**.
 *
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function NoArgCache<T>(ttl: number) {
  return function (target: NoArgMethod<T>, context: ClassMethodDecoratorContext<unknown, NoArgMethod<T>>) {
    if (target.length !== 0) {
      throw new TypeError(
        `@NoArgCache() only decorates a method that takes no parameters, but "${String(context.name)}" declares ${target.length}.`,
      );
    }

    const cacher = new Cacher(target, ttl);
    return function (this: any) {
      return cacher.isEmpty ? cacher.reload(this) : cacher.get();
    };
  };
}
