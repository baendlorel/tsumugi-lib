import { Cacher } from './cacher.js';
import { empty, isPromiseLike } from './common.js';

const methodSym = Symbol('method');

type MethodDecorator = (target: (...args: any[]) => any, context: ClassMethodDecoratorContext) => (this: any) => any;
type Context = ClassMethodDecoratorContext & {
  metadata: {
    [methodSym]: {
      /**
       * This is an instance-to-methodCache map.
       */
      map: WeakMap<any, Map<string | symbol, Cacher>>;
    };
  };
};

const cacheMap = new WeakMap<any, WeakMap<any, Map<string | symbol, Cacher>>>();

function normalizeArgs(args: any[], context: ClassMethodDecoratorContext): { key: string | symbol; ttl: number } {
  let key = context.name;
  let ttl = Infinity;
  if (args.length === 1) {
    if (typeof args[0] === 'string' || typeof args[0] === 'symbol') {
      key = args[0];
    } else if (typeof args[0] === 'number') {
      ttl = args[0];
    } else {
      throw new TypeError(`@Cache expects 1st arg to be string | symbol | number, got ${typeof args[0]}.`);
    }
  } else if (args.length === 2) {
    key = args[0];
    ttl = args[1];
    if (typeof key !== 'string' && typeof key !== 'symbol') {
      throw new TypeError(`@Cache expects 1st arg to be string | symbol, got ${typeof args[0]}.`);
    }
    if (typeof ttl !== 'number') {
      throw new TypeError(`@Cache expects 2nd arg to be number, got ${typeof ttl}.`);
    }
  }
  if (Number.isNaN(ttl)) {
    console.warn(`Assign 'NaN' to ttl might not be a wise choice.`);
  }
  return { key, ttl };
}

/**
 * Caches the result of a no-argument method.
 * **You must handle errors in your method**.
 * @param key The key for the cached method, can be visited in `@SubCache`.
 * @param ttl Time-to-live for the cached value in milliseconds. `Infinity` never expires.
 */
export function Cache(key: string | symbol, ttl?: number): MethodDecorator;
/**
 * Caches the result of a no-argument method.
 * **You must handle errors in your method**.
 */
export function Cache(ttl?: number): MethodDecorator;
export function Cache(...args: any[]) {
  return function (target: (...args: any[]) => any, context: Context) {
    if (target.length !== 0) {
      throw new TypeError(
        `@Cache() only decorates a method that takes no parameters, but "${String(context.name)}" declares ${target.length}.`,
      );
    }

    const { key, ttl } = normalizeArgs(args, context);

    const instanceToMethodCacheMap = new WeakMap<any, Map<string | symbol, Cacher>>();

    context.metadata[methodSym].map = instanceToMethodCacheMap;

    context.addInitializer(function (this: any) {
      /**
       * methodCache's key is `key` or function name if `key` is not explicitly provided.
       */
      const methodCacheMap = new Map<string | symbol, Cacher>();
      instanceToMethodCacheMap.set(this, methodCacheMap);
      methodCacheMap.set(key, new Cacher(target, ttl).setThis(this));
    });

    return function (this: any) {
      const c = instanceToMethodCacheMap.get(this)!.get(key)!;
      return c.isInitialized ? c.get() : c.reload();
    };
  };
}

/**
 * Derive sub-cacher from `@Cache(key,ttl?)`
 * - **`@Cache` must be initialized before `@SubCache` does**.
 * @param key used in `@Cache(key,ttl?)`.
 */
export function SubCache(key: string | symbol) {
  return function (target: (...args: any[]) => any, context: Context) {
    let cacher: Cacher | empty = empty;
    const uniqueKey = Symbol() as any;

    return function (this: any) {
      if (cacher === empty) {
        cacher = context.metadata?.[methodSym].map.get(this)?.get(key) ?? empty;
        if (cacher === empty) {
          throw new Error(`@SubCache cannot find Cacher instance for key "${String(key)}".`);
        }
        if (!cacher.isInitialized) {
          throw new Error(`@Cache('${String(key)}',...) is not initialized, so @SubCache cannot be used yet.`);
        }

        // Initialize the sub-cache with a unique key.
        cacher.derive(uniqueKey, target);
      }
      return cacher.getSub(uniqueKey);
    };
  };
}
