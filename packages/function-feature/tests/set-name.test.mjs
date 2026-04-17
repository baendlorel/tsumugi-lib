import { describe, it, expect } from 'vitest';
import { setName } from '../lib/index.mjs';

describe('setName', () => {
  it('sets function name', () => {
    function fn() {}
    setName(fn, 'newName');
    expect(fn.name).toBe('newName');
  });

  it('sets function name with configurable = false', () => {
    function fn() {}
    Object.defineProperty(fn, 'name', {
      value: 'cannotmodify',
      configurable: false,
      writable: false,
    });
    expect(fn.name).toBe('cannotmodify');
    setName(fn, 'newName');
    expect(fn.name).toBe('cannotmodify');
  });

  it('sets name from symbol description', () => {
    function fn() {}
    setName(fn, Symbol('desc'));
    expect(fn.name).toBe('[desc]');
  });

  it('sets name from symbol with undefined description', () => {
    function fn() {}
    const sym = Symbol();
    setName(fn, sym);
    expect(fn.name).toBe('');
  });
});
