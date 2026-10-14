import { Cacher } from './cacher.js';
import { _weakGetOrInsertComputed } from '@shared/std/map.js';

type Metadata = {
  [sym]: {
    instanceToCacheMap: WeakMap<any, Map<string | symbol, Cacher>>;
  };
};

type MethodCacheDecorator = (
  target: (...args: any[]) => any,
  context: ClassMethodDecoratorContext,
) => (this: any) => any;

const sym = Symbol();
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

    let map: WeakMap<any, Map<string | symbol, Cacher>> | undefined = (ctx.metadata as Metadata)?.[sym]
      ?.instanceToCacheMap;

    // & Ensure [sym].instanceToCacheMap exists at the same time.
    if (!map) {
      (ctx.metadata as Metadata) = {
        [sym]: {
          instanceToCacheMap: (map = new WeakMap<any, Map<string | symbol, Cacher>>()),
        },
      };
    }

    ctx.addInitializer(function (this: any) {
      const cacher = new Cacher(target, ttl).setThis(this);
      cachers.add(cacher);
      const idToCacherMap = _weakGetOrInsertComputed(map, this, () => new Map());
      if (idToCacherMap.has(id)) {
        throw new Error(`Duplicate cache id "${String(id)}" for the same instance.`);
      }
      idToCacherMap.set(id, cacher);
    });

    return function (this: any) {
      return map.get(this)!.get(id)!.get();
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
  return function (target: (...args: any[]) => any, context: ClassMethodDecoratorContext) {
    const sk = Symbol() as any;

    let cacheMap: WeakMap<any, Map<string | symbol, Cacher>> | undefined = undefined;

    // ! Although to @Cache, here is settled
    // ! We cannot assure that @SubCache initializes before @Cache.
    // ! So we can only get cacheMap for now.
    context.addInitializer(function (this: any) {
      if (cacheMap) {
        return; // Maybe it's already initialized, because the range with-in the decorator context are the same.
      }
      cacheMap = (context.metadata as Metadata)?.[sym].instanceToCacheMap;
      if (!cacheMap) {
        throw new Error(`'cacheMap' for "${String(formId)}" not found.`);
      }
    });

    return function (this: any) {
      const c = cacheMap!.get(this)?.get(formId);
      if (!c?.initialized) {
        throw new Error(`Cacher "${String(formId)}" not found or initialized.`);
      }

      // Initialize the sub-cache with a unique key.
      return c.getOrDerive(sk, target);
    };
  };
}
