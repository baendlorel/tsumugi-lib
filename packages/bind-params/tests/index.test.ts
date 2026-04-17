import { describe, it, expect } from 'vitest';
import { bindParams } from '../src/index.js';

describe('bindParams - runtime behavior', () => {
  it('binds leading arguments and calls original function', () => {
    const calls: any[] = [];
    function fn(a: number, b: string, c: boolean) {
      calls.push([a, b, c]);
      return `${a}-${b}-${c}`;
    }

    const bound = bindParams(fn, 1, 'x');
    const res = bound(true);

    expect(res).toBe('1-x-true');
    expect(calls).toEqual([[1, 'x', true]]);
  });

  it('preserves function length', () => {
    function original(a: number, b: number, c: number) {}
    const bound = bindParams(original, 1);

    expect(bound.length).toBe(Math.max(0, original.length - 1));
  });

  it('supports binding 0 arg', () => {
    function original(a: number, b: number) {
      return a + b;
    }
    const bound = bindParams(original);
    expect(bound(1, 2)).toBe(3);
  });

  it('works when binding all args', () => {
    function original(a: number, b: number) {
      return a + b;
    }
    const bound = bindParams(original, 2, 3);
    expect(bound()).toBe(5);
  });

  it('works with variadic functions', () => {
    function sum(...nums: number[]) {
      return nums.reduce((s, n) => s + n, 0);
    }
    const bound = bindParams(sum, 1, 2) as any;
    expect(bound(3, 4)).toBe(10); // 1+2+3+4
  });

  it('handles functions with optional and default params', () => {
    function greet(a: string, b?: string, c = '!') {
      return a + (b ?? '') + c;
    }
    const bound = bindParams(greet, 'hi');
    expect(bound()).toBe('hi!');
    const bound2 = bindParams(greet, 'hi', ' there');
    expect(bound2()).toBe('hi there!');
  });

  it('does not mutate original function', () => {
    function foo(a: number, b: number) {
      return a * b;
    }
    const f2 = bindParams(foo, 2);
    expect(foo.length).toBe(2);
    expect(f2.length).toBe(1);
  });

  it('bound function calls underlying with correct `this`', () => {
    const obj = {
      x: 10,
      get(this: any, add: number) {
        return this.x + add;
      },
    } as any;

    const bound = bindParams(obj.get, 2);

    // calling without bind: 'this' is undefined, so expect NaN if uses this.x
    expect(bound).throw(`Cannot read properties of undefined (reading 'x')`);

    // ensure original still works when called as method
    expect(obj.get(5)).toBe(15);
    obj.get = bound;
    expect(obj.get()).toBe(12);
  });
});
