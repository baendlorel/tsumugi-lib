import { Cacher } from './cacher.js';
import { _weakGetOrInsertComputed } from '@shared/std/map.js';

type MethodCacheDecorator = (
  target: (...args: any[]) => any,
  context: ClassMethodDecoratorContext,
) => (this: any) => any;

// & Keyed by instance, so it doesn't matter which class (parent or child) declares the decorators, or in which order.
// & Also no reliance on `context.metadata`, which is undefined where `Symbol.metadata` is missing (e.g. tsc output on Node 24).
const instanceToCacheMap = new WeakMap<any, Map<string | symbol, Cacher>>();
const cachers = new Set<Cacher>();

/**
 * Load all decorated caches.
 * - Calls reload of the uninitialized caches.
 * - **Only** affects cachers that are decorated with `@Cache`.
 * @returns a promise that you can await to ensure all decorated caches have been initialized.
 */
export function initializeDecoratedCaches(force = false): Promise<any[]> {
  return Promise.all([...cachers].map((c) => (c.initialized && !force ? true : c.reload())));
}

/**
 * Caches the result of a no-argument method.
 * **You must handle errors in your method**.
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
    throw new TypeError(`@Cache expects an options object with at least an 'id' property.`);
  }
  if (ttl !== undefined && typeof ttl !== 'number') {
    throw new TypeError(`@Cache expects 'ttl' to be a number if provided, got ${typeof ttl}.`);
  }
  // #endregion

  return function (target: (...args: any[]) => Promise<any>, ctx: ClassMethodDecoratorContext) {
    if (target.length !== 0) {
      throw new TypeError(`"${String(target.name)}" decorated with @Cache() has more than 0 parameters.`);
    }

    ctx.addInitializer(function (this: any) {
      const cacher = new Cacher(target, ttl).setThis(this);
      cachers.add(cacher);
      const idToCacherMap = _weakGetOrInsertComputed(instanceToCacheMap, this, () => new Map());
      if (idToCacherMap.has(id)) {
        throw new Error(`Duplicate cache id "${String(id)}" for the same instance.`);
      }
      idToCacherMap.set(id, cacher);
    });

    return function (this: any) {
      return instanceToCacheMap.get(this)!.get(id)!.get();
    };
  };
}

/**
 * Derive sub-cacher from `@Cache({ id, ttl? })` and the decorated method.
 * - Decorated method must be **SYNC**.
 * - `@Cache` must be  **initialized** before `@SubCache` does.
 * @param formId id used in Cache decorator.
 */
export function SubCache(formId: string) {
  return function (target: (...args: any[]) => any, _context: ClassMethodDecoratorContext) {
    const sk = Symbol() as any;

    // ! Cannot check for the @Cache at construction: @SubCache's initializer may run first
    // ! (declared above it, or declared in a parent class while @Cache is in the child).
    return function (this: any) {
      const c = instanceToCacheMap.get(this)?.get(formId);
      if (!c?.initialized) {
        throw new Error(`Cacher "${String(formId)}" not found or initialized.`);
      }

      // Initialize the sub-cache with a unique key.
      return c.getOrDerive(sk, target);
    };
  };
}
