import { Cacher } from './cacher.js';
import { _getOrInsertComputed } from '@shared/std/map.js';

/**
 * Type of a method decorated with `@Cache`.
 * The decorated method **must be `async`** (i.e. it must return a `Promise`); a sync method
 * would be typed as `Promise<R>` at the call site while actually returning a plain value.
 */
type MethodCacheDecorator = <This, R>(
  target: (this: This) => Promise<R>,
  context: ClassMethodDecoratorContext<This, (this: This) => Promise<R>>,
) => (this: This) => Promise<R>;

/**
 * Type of a method decorated with `@SubCache`.
 * A decorator cannot change a method's parameter list, so the decorated method **must be `async`
 * and declare its parameter optional** — it is always called with no argument at the call site,
 * and the parent's cached value is what the method body receives.
 */
type MethodSubCacheDecorator = <This, T, R>(
  target: (this: This, value?: T) => R | Promise<R>,
  context: ClassMethodDecoratorContext<This, (this: This, value?: T) => Promise<R>>,
) => (this: This, value?: T) => Promise<R>;

// & Keyed by instance, so it doesn't matter which class (parent or child) declares the decorators, or in which order.
// & Also no reliance on `context.metadata`, which is undefined where `Symbol.metadata` is missing (e.g. tsc output on Node 24).
const instanceToCacheMap = new Map<any, Map<string | symbol, Cacher>>();

/**
 * Load all decorated caches.
 * - Calls reload of the uninitialized caches.
 * - **Only** affects cachers that are decorated with `@Cache`.
 * @returns a promise that you can await to ensure all decorated caches have been initialized.
 */
export function initializeDecoratedCaches(force = false): Promise<any[]> {
  return Promise.all(
    [...instanceToCacheMap.values()]
      .flatMap((idToCacherMap) => [...idToCacherMap.values()])
      .map((c) => (c.initialized && !force ? true : c.reload())),
  );
}

/**
 * Caches the result of a no-argument **async** method.
 * **You must handle errors in your method**.
 * The method must be `async`: the cached value is always accessed through a promise.
 * @param id The id for the cached method, can be visited in `@SubCache`.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(options: { id: string | symbol; ttl?: number }): MethodCacheDecorator {
  // #region Argument validation
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`@Cache expects an options object with at least an 'id' property.`);
  }

  const { id, ttl = Infinity } = options;

  if (typeof id !== 'string' && typeof id !== 'symbol') {
    throw new TypeError(`@Cache expects 'id' to be a string or symbol.`);
  }
  // #endregion

  return function <This, R>(
    target: (this: This) => Promise<R>,
    ctx: ClassMethodDecoratorContext<This, (this: This) => Promise<R>>,
  ) {
    ctx.addInitializer(function (this: any) {
      const c = new Cacher(target, ttl).setThis(this);

      const idToCacherMap = _getOrInsertComputed(instanceToCacheMap, this, () => new Map());
      if (idToCacherMap.has(id)) {
        throw new Error(`Duplicate cache id "${String(id)}" for the same instance.`);
      }
      idToCacherMap.set(id, c);
    });

    return function (this: any) {
      return instanceToCacheMap.get(this)!.get(id)!.get();
    };
  };
}

/**
 * Derive sub-cacher from `@Cache({ id, ttl? })` and the decorated method.
 * - Decorated method must be **async**, and its parameter must be **optional**.
 * - `@Cache` must be  **initialized** before `@SubCache` does.
 * @param fromId id used in Cache decorator.
 */
export function SubCache(fromId: string | symbol): MethodSubCacheDecorator {
  return function <This, T, R>(
    target: (this: This, value?: T) => R | Promise<R>,
    _context: ClassMethodDecoratorContext<This, (this: This, value?: T) => Promise<R>>,
  ) {
    const sk = Symbol() as any;

    // ! Cannot check for the @Cache at construction: @SubCache's initializer may run first
    // ! (declared above it, or declared in a parent class while @Cache is in the child).
    return async function (this: any) {
      const c = instanceToCacheMap.get(this)?.get(fromId);
      if (!c) {
        throw new Error(`Cacher "${String(fromId)}" not found.`);
      }
      return c.getOrDerive(sk, target);
    };
  };
}
