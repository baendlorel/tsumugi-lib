import { describe, it, expect } from 'vitest';
import { getOrigin } from '../lib/index.mjs';

describe('getOrigin', () => {
  it('unwraps bound and proxy functions', () => {
    function base() {}
    const proxy = new Proxy(base, {});
    const bound = proxy.bind(null);
    expect(getOrigin(bound)).toBe(base);
    expect(getOrigin(proxy)).toBe(base);
  });

  it('returns itself for non-wrapped function', () => {
    function foo() {}
    expect(getOrigin(foo)).toBe(foo);
  });

  it('returns object itself if not proxy', () => {
    const obj = { a: 1 };
    expect(getOrigin(obj)).toBe(obj);
  });

  it('unwraps proxy object', () => {
    const target = { x: 1 };
    const handler = {};
    const proxy = new Proxy(target, handler);
    expect(getOrigin(proxy)).toEqual(target);
  });
});
