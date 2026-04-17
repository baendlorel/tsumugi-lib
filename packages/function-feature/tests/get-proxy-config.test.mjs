import { describe, it, expect } from 'vitest';
import { getProxyConfig } from '../lib/index.mjs';

describe('getProxyConfig', () => {
  it('returns target and handler for proxy function', () => {
    function base() {}
    const handler = { apply() {} };
    const proxy = new Proxy(base, handler);
    const info = getProxyConfig(proxy);
    expect(info.target).toBe(base);
    expect(info.handler).toBe(handler);
  });

  it('returns target and handler for proxy object', () => {
    const target = { x: 1 };
    const handler = { get() {} };
    const proxy = new Proxy(target, handler);
    const info = getProxyConfig(proxy);
    expect(info.target).toBe(target);
    expect(info.handler).toBe(handler);
  });

  it('returns undefined for non-proxy', () => {
    function foo() {}
    expect(getProxyConfig(foo)).toBeUndefined();
    expect(getProxyConfig({})).toBeUndefined();
  });
});
