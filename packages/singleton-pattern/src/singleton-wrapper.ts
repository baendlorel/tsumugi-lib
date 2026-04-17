import type { ProxiedClass, Class, SingletonifyOptions } from './global.js';

const proxiedToTarget = new WeakMap<ProxiedClass, Class>();
const targetToProxied = new WeakMap<Class, ProxiedClass>();

/**
 * ## Usage
 * Just wrap your class with this function to create a new class that always returns the same instance
 * @param target The class to be wrapped
 * @param options Advanced options
 * - changeProtoConstructor(default: `true`) will set `target.prototype.constructor` to the singletonified class
 * - onlyOnce(default: `true`) will cache the input and always return the same proxied class
 *
 * __PKG_INFO__
 */
export function singletonify<T extends Class>(target: T, options?: SingletonifyOptions): T {
  const opts = Object(options);
  const changeProtoConstructor = opts.changeProtoConstructor ?? true;
  const onlyOnce = opts.onlyOnce ?? true;

  if (onlyOnce) {
    const cached = targetToProxied.get(target);
    if (cached) {
      return cached as T;
    }
  }

  let instance: object | undefined;
  const proxied = new Proxy(target, {
    construct(cls, args): object {
      if (!instance) {
        instance = new cls(...args) as object;
      }
      return instance;
    },
  }) as T;

  if (changeProtoConstructor) {
    proxied.prototype.constructor = proxied;
  }

  if (onlyOnce) {
    proxiedToTarget.set(proxied as ProxiedClass, target);
    targetToProxied.set(target, proxied as ProxiedClass);
  }

  return proxied;
}

/**
 * Retrieves the original class from the singletonified class
 * @param singleton The singletonified class
 * @returns `undefined` if the class is not singletonified, otherwise returns the original class
 */
export const getSingletonTarget = <T extends Class>(singleton: T): T | undefined => {
  return proxiedToTarget.get(singleton) as T | undefined;
};
