import { describe, it, expect } from 'vitest';
import { getFeatures } from 'function-feature';

describe('published', () => {
  it('test', () => {
    const a = () => {};
    const feat = getFeatures(a);
    expect(feat.isConstructor).toBe(false);
    expect(feat.isAsyncFunction).toBe(false);
  });
});
