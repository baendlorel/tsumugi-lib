import { describe, it, expect } from 'vitest';
import { getBound } from '../lib/index.mjs';

describe('getBound', () => {
  it('returns original for bound', () => {
    function bar() {}
    const bound1 = bar.bind(null);
    const bound2 = bound1.bind(null);
    expect(getBound(bound1)).toBe(bar);
    expect(getBound(bound2)).not.toBe(getBound(bound1));
  });

  it('returns undefined for non-bound', () => {
    function baz() {}
    expect(getBound(baz)).toBeUndefined();
  });
});
