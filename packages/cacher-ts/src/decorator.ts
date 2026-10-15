import { DuoMap } from '@duo-map';
import { Cacher } from './cacher.js';

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

const instanceToCache = new DuoMap<any, string, Cacher>();

/**
 * Load all decorated caches.
 * - Calls reload of the uninitialized caches.
 * - **Only** affects cachers that are decorated with `@Cache`.
 * @returns a promise that you can await to ensure all decorated caches have been initialized.
 */
export function initializeDecoratedCaches(force = false): Promise<any[]> {
  return Promise.all([...instanceToCache.values()].map((c) => (c.initialized && !force ? true : c.reload())));
}

/**
 * Destroy the decorated cache for the given id and instance, to free up resources and remove it from the internal cache map.
 * @param id Registered id
 * @param instance Instance of the class.
 */
export function destroyDecoratedCache(id: string, instance: any): void {
  const c = instanceToCache.get(instance, id);
  if (c) {
    instanceToCache.delete(instance, id);
    c.destroy();
  }
}

/**
 * Destroy the decorated sub-cache for the given id, subId, and instance, to free up resources and remove it from the internal cache map.
 * @param id Registered id of the parent cache
 * @param subId Registered id of the sub-cache
 * @param instance Instance of the class.
 */
export function destroyDecoratedSubCache(id: string, subId: string, instance: any): void {
  const c = instanceToCache.get(instance, id);
  if (!c) {
    throw new Error(`SubCache "${id}:${subId}" not found.`);
  }
  c.deleteSub(subId);
}

/**
 * Caches the result of a no-argument **async** method.
 * **You must handle errors in your method**.
 * The method must be `async`: the cached value is always accessed through a promise.
 * @param id The id for the cached method, can be visited in `@SubCache`.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(options: { id: string; ttl?: number }): MethodCacheDecorator {
  // #region Argument validation
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`@Cache expects an options object with at least an 'id' property.`);
  }

  const { id, ttl = Infinity } = options;

  if (typeof id !== 'string') {
    throw new TypeError(`@Cache expects 'id' to be a string.`);
  }
  // #endregion

  return function <This, R>(
    target: (this: This) => Promise<R>,
    ctx: ClassMethodDecoratorContext<This, (this: This) => Promise<R>>,
  ) {
    const wrapper = function (this: any) {
      return instanceToCache.get(this, id)!.get();
    };

    ctx.addInitializer(function (this: any) {
      // If a subclass overrides this method without @Cache, its prototype won't carry our
      // wrapper — skip registration to avoid an orphan Cacher that is never called.
      if ((Object.getPrototypeOf(this) as any)[ctx.name] !== wrapper) {
        return;
      }

      if (instanceToCache.has(this, id)) {
        throw new Error(`Duplicate cache id "${id}" for the same instance.`);
      }
      instanceToCache.set(this, id, new Cacher(target, ttl, this));
    });

    return wrapper;
  };
}

/**
 * Derive sub-cacher from `@Cache({ id, ttl? })` and the decorated method.
 * - Decorated method must be **async**, and its parameter must be **optional**.
 * - `@Cache` must be  **initialized** before `@SubCache` does.
 * - Silently overrides any existing sub-cache with the same `subId`.
 * @param fromId id used in `@Cache` decorator.
 * @param subId id for the sub-cache derived from the parent cache.
 */
export function SubCache(fromId: string, subId: string): MethodSubCacheDecorator {
  return function <This, T, R>(
    target: (this: This, value?: T) => R | Promise<R>,
    _context: ClassMethodDecoratorContext<This, (this: This, value?: T) => Promise<R>>,
  ) {
    return async function (this: any) {
      const c = instanceToCache.get(this, fromId);
      if (!c) {
        throw new Error(`Cacher "${fromId}" not found.`);
      }
      return c.getOrDerive(subId, target);
    };
  };
}
