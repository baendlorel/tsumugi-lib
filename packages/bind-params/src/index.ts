import type { Params, Chop } from './global.js';
import { $define, $max } from '@shared';

/**
 * Creates a new function with bound leading arguments.
 * - preserves `length`, but does not preserve `name`.
 * - preserves `this` context.
 * - if 0 argument are bound, returns the original `fn`.
 * - full type hints are provided.
 * @param fn the function to bind arguments to
 * @param bound first N arguments to bind
 * @returns a new function with bound leading arguments
 *
 * ## Example
 * ```ts
 * function oldFn(a: number, b: string, c: boolean): void {}
 * const newFn = bindParams(oldFn, 42, 'hello'); // newFn: (c: boolean) => void
 * ```
 *
 * ## Notes
 * - trusts `Function.prototype.call` is not modified.
 * - maximum bound count is **16**, you can modify `index.d.ts` to make it greater.
 *
 * __PKG_INFO__
 */
export function bindParams<
  T extends (...args: any[]) => any,
  Bound extends Params<T> = [],
  Remainder extends any[] = Chop<Parameters<T>, Bound['length']>,
>(fn: T, ...bound: Bound & Partial<Parameters<T>>): (...args: Remainder) => ReturnType<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('First argument must be a function');
  }

  if (bound.length === 0) {
    return fn;
  }

  const newFn = function (this: any, ...args: any[]) {
    return fn.call(this, ...bound, ...args);
  };

  // $define(newFn, 'name', { value: fn.name, configurable: true });
  $define(newFn, 'length', {
    value: $max(0, fn.length - bound.length),
    configurable: true,
  });

  return newFn;
}
