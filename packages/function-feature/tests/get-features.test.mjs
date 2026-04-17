import { describe, it, expect } from 'vitest';
import { getFeatures } from '../lib/index.mjs';

describe('getFeatures', () => {
  describe('normal', () => {
    it('regular function', () => {
      function regularFunc() {}
      const flags = getFeatures(regularFunc);
      expect(flags.isConstructor).toBe(true);
      expect(flags.isAsyncFunction).toBe(false);
      expect(flags.isGeneratorFunction).toBe(false);
      expect(flags.isBound).toBe(false);
      expect(flags.isClass).toBe(false);
    });

    it('bound function', () => {
      function foo() {}
      const bound = foo.bind(null);
      const flags = getFeatures(bound);
      expect(flags.isBound).toBe(true);
      expect(flags.isConstructor).toBe(true);
    });

    it('class', () => {
      class A {}
      const flags = getFeatures(A);
      expect(flags.isBound).toBe(false);
      expect(flags.isConstructor).toBe(true);
      expect(flags.isCallable).toBe(true);
      expect(flags.isClass).toBe(true);
    });
  });

  describe('advanced', () => {
    it('proxy function', () => {
      function base() {}
      const proxy = new Proxy(base, {});
      const flags = getFeatures(proxy);
      expect(flags.isProxy).toBe(true);
      expect(flags.origin).toBe(base);
    });

    it('bound proxy function', () => {
      function base() {}
      const proxy = new Proxy(base, {});
      const bound = proxy.bind(null);
      const flags = getFeatures(bound);
      expect(flags.isBound).toBe(true);
      expect(flags.isProxy).toBe(false);
      expect(flags.origin).toBe(base);
    });

    it('proxy object throws', () => {
      const target = { x: 1 };
      const proxy = new Proxy(target, {});
      expect(() => getFeatures(proxy)).toThrow();
    });
  });
});
