export type Chop<T extends any[], N extends number, Acc extends any[] = []> = Acc['length'] extends N
  ? T
  : T extends [infer Head, ...infer Rest]
    ? Chop<Rest, N, [...Acc, Head]>
    : [];

type NParams<Fn extends (...args: any[]) => any, N extends number, Acc extends any[] = []> = Acc['length'] extends N
  ? Acc
  : Parameters<Fn> extends readonly [infer First, ...infer Rest]
    ? Rest extends any[]
      ? NParams<(...args: Rest) => any, N, [...Acc, First]>
      : Acc
    : Acc;

type ParamPossibility<
  Fn extends (...args: any[]) => any,
  MaxN extends number,
  Counter extends any[] = [],
  Result = [],
> = Counter['length'] extends MaxN
  ? Result | Parameters<Fn>
  : ParamPossibility<
      Fn,
      MaxN,
      [...Counter, any],
      Result | (Counter['length'] extends 0 ? [] : NParams<Fn, Counter['length']>)
    >;

export type Params<Fn extends (...args: any[]) => any> = ParamPossibility<Fn, 17>;
