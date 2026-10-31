type Arr<A extends number, T extends number[] = []> = T['length'] extends A ? T : Arr<A, [...T, T['length']]>;

type ArrayToUnion<T extends any[]> = T[number];

type Diff<A, B> = A extends B ? never : A;

/**
 * 左闭右开区间
 */
export type Range<min extends number, max extends number> = Diff<ArrayToUnion<Arr<max>>, ArrayToUnion<Arr<min>>>;
