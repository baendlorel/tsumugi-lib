export type Compose<Types extends readonly unknown[]> = Types extends readonly [infer Head, ...infer Tail]
  ? Head & Compose<Tail>
  : unknown;

export type Constructor = new (...args: unknown[]) => unknown;

export type IntersectAll<Types extends readonly unknown[]> = Compose<Types>;
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
