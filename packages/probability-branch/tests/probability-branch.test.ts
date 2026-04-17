import { describe, it, expect } from 'vitest';
import { pb } from '../src/probability-branch.js';

describe('ProbabilityBranch Core', () => {
  it('selects correct branch by manual probability', () => {
    const result: number[] = [];
    const branch = pb({ limit: 0 })
      .br(1, () => result.push(1))
      .br(2, () => result.push(2))
      .br(3, () => result.push(3));

    branch.run(0);
    branch.run(1.5);
    branch.run(3.5);

    expect(result).toEqual([1, 2, 3]);
  });

  it('returns undefined if no branches', () => {
    const branch = pb();
    expect(branch.run(0).returned).toBeUndefined();
  });

  it('limit works: branch only runs specified times', () => {
    const result: number[] = [];
    const branch = pb({ limit: 2 }).br(1, () => result.push(1));
    branch.run();
    branch.run();
    expect(() => branch.run()).toThrow();
    expect(result.length).toBe(2);
  });

  it('getCount returns run count', () => {
    const branch = pb();
    expect(branch.getCount()).toBe(0);
    branch.br(1, () => 1).run();
    expect(branch.getCount()).toBe(1);
  });
});
