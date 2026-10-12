export const empty = Symbol();
export type empty = typeof empty;

/**
 * A thenable type. Usually a `Promise` object.
 */
export type PromiseLike<T> = { then: (onfulfilled: (value: T) => any) => any };

export function isPromiseLike<T>(value: any): value is PromiseLike<T> {
  return value && typeof value.then === 'function';
}
