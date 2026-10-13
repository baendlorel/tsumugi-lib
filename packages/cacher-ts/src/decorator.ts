import { Cacher } from './cacher.js';

const sym = Symbol();

type Context = ClassMethodDecoratorContext & {
  metadata: {
    [sym]: {
      /**
       * This is an instance-to-methodCache map.
       */
      instanceToCacheMap: WeakMap<any, Map<string | symbol, Cacher>>;
    };
  };
};
type MethodDecorator = (target: (...args: any[]) => any, context: Context) => (this: any) => any;

/**
 * Caches the result of a no-argument method.
 * **You must handle errors in your method**.
 * @param id The id for the cached method, can be visited in `@SubCache`.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(options: { id: string | symbol; ttl?: number }): MethodDecorator {
  // #region Argument validation
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`@Cache expects an options object with at least an 'id' property.`);
  }

  const { id, ttl = Infinity } = options;

  if (typeof id !== 'string') {
    throw new TypeError(`@Cache expects an options object with at least an 'id' property.`);
  }
  if (ttl !== undefined && typeof ttl !== 'number') {
    throw new TypeError(`@Cache expects 'ttl' to be a number if provided, got ${typeof ttl}.`);
  }
  // #endregion

  return function (target: (...args: any[]) => any, context: Context) {
    if (target.length !== 0) {
      throw new TypeError(`"${String(target.name)}" decorated with @Cache() has more than 0 parameters.`);
    }

    const meta = context.metadata;

    let map: WeakMap<any, Map<string | symbol, Cacher>>;
    if (meta?.[sym]?.instanceToCacheMap) {
      map = meta[sym].instanceToCacheMap;
    } else {
      map = new WeakMap<any, Map<string | symbol, Cacher>>();
      meta[sym] = meta[sym] ?? {};
      meta[sym].instanceToCacheMap = map;
    }

    context.addInitializer(function (this: any) {
      map.getOrInsertComputed(this, () => new Map()).set(id, new Cacher(target, ttl).setThis(this));
    });

    return function (this: any) {
      const c = map.get(this)!.get(id)!;
      return c.isInitialized ? c.get() : c.reload();
    };
  };
}

/**
 * Derive sub-cacher from `@Cache({ id, ttl? })` and the decorated method.
 * - `@Cache` must be  **initialized** before `@SubCache` does.
 * @param formId id used in Cache decorator.
 */
export function SubCache(formId: string) {
  return function (target: (...args: any[]) => any, context: Context) {
    const sk = Symbol() as any;

    return function (this: any) {
      const c = context.metadata?.[sym].instanceToCacheMap.get(this)?.get(formId);
      if (!c) {
        throw new Error(`@SubCache cannot find Cacher instance for key "${String(formId)}".`);
      }
      if (!c.isInitialized) {
        throw new Error(`@SubCache cannot use uninitialized cache for key "${String(formId)}".`);
      }

      // Initialize the sub-cache with a unique key.
      return c.getOrDerive(sk, target);
    };
  };
}
