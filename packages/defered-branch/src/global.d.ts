export type AnyFn = (...args: any[]) => any;
export type Predicate<Fn extends AnyFn> = (...args: Parameters<Fn>) => boolean;
