import { describe, it, expect } from 'vitest';
import { pb } from '../src/probability-branch.js';

describe('Edge Cases', () => {
  it('add branch with zero weight is ignored', () => {
    const result: number[] = [];
    const branch = pb({ limit: 0 })
      .br(0, () => result.push(1))
      .br(1, () => result.push(2));
    branch.run(0);
    expect(result).toEqual([2]);
  });

  it('add branch with negative weight throws', () => {
    const branch = pb();
    expect(() => branch.br(-1, () => 1)).toThrow();
  });

  it('add branch with non-number weight throws', () => {
    const branch = pb();
    // @ts-expect-error
    expect(() => branch.br('a', () => 1)).toThrow();
  });

  it('add branch with non-function handler throws', () => {
    const branch = pb();
    // @ts-expect-error
    expect(() => branch.br(1, 123)).toThrow();
  });

  it('run with probability out of range selects last branch', () => {
    const branch = pb({ limit: 0 })
      .br(1, () => 'A')
      .br(1, () => 'B');
    expect(branch.run(999).returned).toBe('B');
  });

  it('run with probability very close to sum selects last branch', () => {
    const branch = pb({ limit: 0 })
      .br(1, () => 'A')
      .br(1, () => 'B');
    expect(branch.run(1.999999999).returned).toBe('B');
  });

  it('limit=0 allows unlimited runs', () => {
    const branch = pb({ limit: 0 }).br(1, () => 1);
    for (let i = 0; i < 100; i++) branch.run();
    expect(branch.getCount()).toBe(100);
  });

  it('MAX_NUM weight is accepted', () => {
    const branch = pb({ limit: 0 })
      .br(Number.MAX_SAFE_INTEGER, () => 'big')
      .br(1, () => 'small');
    expect(branch.run(0).returned).toBe('big');
  });

  it('run after clear returns undefined', () => {
    const branch = pb().br(1, () => 1);
    branch.run();
    expect(() => branch.run().returned).throws();
  });
});
