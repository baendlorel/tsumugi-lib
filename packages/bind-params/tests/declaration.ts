// This file is for manual type-checking in editors (no vitest imports)
// Open this file in your IDE to inspect for red squiggles.

import { bindParams } from '../src/index.js';

// 1) Simple function
function f1(a: number, b: string, c: boolean): void {}
const b1 = bindParams(f1, 42);

// 2) Bind two args
const b2: (c: boolean) => void = bindParams(f1, 1, 'x');

// 3) Bind all args
const b3: () => void = bindParams(f1, 1, 'x', true);

// 4) Optional and default params
function f2(a: string, b?: number, c = 5) {
  return a + b?.toString() + c;
}
const b4: (b?: number, c?: number) => string = bindParams(f2, 'hi');

// 5) Variadic
function f3(...nums: number[]) {
  return nums.length;
}
const b5: (...nums: number[]) => number = bindParams(f3, 1, 2);

// 6) Generic function
function f4<T>(a: T, b: T[]) {
  return b.concat([a]);
}
const b6: (b: number[]) => number[] = bindParams(f4 as (a: number, b: number[]) => number[], 1);

// 7) Ensure `name` preserved (runtime property, check in editor/console)
function specialName(a: number) {}
const b7: () => void = bindParams(specialName, 1);

// 8) Edge cases: zero bound
const b8: (a: number, b: string, c: boolean) => void = bindParams(f1);

// 9) Use in variable annotations
type FnType = (x: number, y: string) => boolean;
const fnVar: FnType = (x, y) => true;
const b9: (y: string) => boolean = bindParams(fnVar, 1);

// 10) Tuples and rest
function tupleFn(a: [number, string], ...rest: string[]) {
  return a[0];
}
const b10: (...rest: string[]) => number = bindParams(tupleFn, [1, 's']);

// Look at the inferred types above in your editor to validate correctness.
