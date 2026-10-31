type Arr<A extends number, T extends number[] = []> = T['length'] extends A ? T : Arr<A, [...T, T['length']]>;

type ArrayToUnion<T extends any[]> = T[number];

type Diff<A, B> = A extends B ? never : A;

/**
 * 左闭右开区间类型
 * - `Interval<0, 6>` 表示 0, 1, 2, 3, 4, 5
 */
export type Interval<min extends number, max extends number> = Diff<ArrayToUnion<Arr<max>>, ArrayToUnion<Arr<min>>>;
