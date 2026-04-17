import { describe, it, expect } from 'vitest';
import conditionalCompilation from '../src/index.js';

describe('conditionalCompilation options', () => {
  it('supports disabling expression cache', () => {
    expect(() =>
      conditionalCompilation({
        variables: { FLAG: true },
        expressionCache: false,
        sourceType: 'script',
        ecmaVersion: 'latest',
      }),
    ).not.toThrow();
  });

  it('validates expressionCache option type', () => {
    expect(() =>
      conditionalCompilation({
        variables: {},
        expressionCache: 'yes' as unknown as boolean,
      }),
    ).toThrow('expressionCache');
  });
});
