export function promiseTry<Fn extends (...args: any[]) => any>(
  fn: Fn,
  thisArg: any,
  ...args: Parameters<Fn>
): Promise<Awaited<ReturnType<Fn>>> {
  try {
    return Promise.resolve(fn.apply(thisArg, args));
  } catch (e) {
    return Promise.reject(e);
  }
}
