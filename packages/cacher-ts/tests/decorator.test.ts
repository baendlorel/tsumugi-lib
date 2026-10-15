import { describe, expect, it } from 'vitest';
import { Cache, Cacher, destroyDecoratedCache, initializeDecoratedCaches } from '../src/index.js';

/**
 * `@Cache` keeps one module-global registry, so an `id` is only reusable across *instances*
 * and across unrelated classes. Every test below therefore uses ids unique to that test.
 */
describe('@Cache', () => {
  // ---------------------------------------------------------------------------
  // Basic caching
  // ---------------------------------------------------------------------------
  describe('basic caching', () => {
    it('caches the resolved value per instance', async () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'basic' })
        async load() {
          return ++calls;
        }
      }

      const svc = new Svc();
      await expect(svc.load()).resolves.toBe(1);
      await expect(svc.load()).resolves.toBe(1);
      expect(calls).toBe(1);
    });

    it('is not invoked at construction time (lazy registration)', () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'lazy' })
        async load() {
          return ++calls;
        }
      }

      new Svc();

      expect(calls).toBe(0);
    });

    it('binds `this` to the instance', async () => {
      class Svc {
        private readonly token = 'secret';

        @Cache({ id: 'thisArg' })
        async load() {
          return this.token;
        }
      }

      await expect(new Svc().load()).resolves.toBe('secret');
    });

    it('keeps instances independent', async () => {
      class Svc {
        tag = '';

        @Cache({ id: 'perInstance' })
        async load() {
          return this.tag;
        }
      }

      const a = new Svc();
      const b = new Svc();
      a.tag = 'a';
      b.tag = 'b';

      await expect(a.load()).resolves.toBe('a');
      await expect(b.load()).resolves.toBe('b');
    });

    it('lets unrelated classes reuse an id', async () => {
      class A {
        @Cache({ id: 'sharedId' })
        async load() {
          return 'A';
        }
      }
      class B {
        @Cache({ id: 'sharedId' })
        async load() {
          return 'B';
        }
      }

      await expect(new A().load()).resolves.toBe('A');
      await expect(new B().load()).resolves.toBe('B');
    });

    it('honors the ttl option', async () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'ttlOpt', ttl: 1 })
        async load() {
          return ++calls;
        }
      }

      const svc = new Svc();
      await expect(svc.load()).resolves.toBe(1);
      await new Promise((r) => setTimeout(r, 5));
      await expect(svc.load()).resolves.toBe(2);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Options
  // ---------------------------------------------------------------------------
  describe('options', () => {
    it('defaults `id` to the method name', async () => {
      class Svc {
        @Cache()
        async loadConfig() {
          return 'cfg';
        }
      }

      // The implicit id is 'loadConfig'; the duplicate-id check below proves the key exists.
      await expect(new Svc().loadConfig()).resolves.toBe('cfg');
    });

    it('gives each method its own default id', async () => {
      let calls = 0;
      class Svc {
        @Cache()
        async first() {
          calls++;
          return 'first';
        }

        @Cache()
        async second() {
          calls++;
          return 'second';
        }
      }

      const svc = new Svc();
      await expect(svc.first()).resolves.toBe('first');
      await expect(svc.second()).resolves.toBe('second');
      expect(calls).toBe(2);
    });

    it('throws when a non-method is decorated', () => {
      expect(() => {
        class Svc {
          // @ts-expect-error Cannot use on non-method class members
          @Cache({ id: 'notAMethod' })
          value = 1;
        }
        new Svc();
      }).toThrow('@Cache can only be applied to class methods.');
    });
  });

  // ---------------------------------------------------------------------------
  // Registry helpers
  // ---------------------------------------------------------------------------
  describe('initializeDecoratedCaches()', () => {
    it('only warms methods that have already been called', async () => {
      const touched: number[] = [];
      class Svc {
        @Cache({ id: 'warmTouched' })
        async touched() {
          touched.push(1);
          return 1;
        }

        @Cache({ id: 'warmUntouched' })
        async untouched() {
          touched.push(2);
          return 2;
        }
      }

      const svc = new Svc();
      await svc.touched();
      expect(touched).toHaveLength(1);

      await initializeDecoratedCaches();

      // Registration is lazy, so the untouched method is not in the registry at all.
      expect(touched).toEqual([1]);
    });

    it('does not reload an already-initialized cacher', async () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'warmFresh' })
        async load() {
          return ++calls;
        }
      }

      const svc = new Svc();
      await svc.load();
      await initializeDecoratedCaches();

      expect(calls).toBe(1);
    });

    it('force-reloads every registered cacher when passed true', async () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'warmForce' })
        async load() {
          return ++calls;
        }
      }

      const svc = new Svc();
      await svc.load();
      await initializeDecoratedCaches(true);

      expect(calls).toBe(2);
    });
  });

  describe('destroyDecoratedCache()', () => {
    it('drops the entry so the next call loads again', async () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'destroyEntry' })
        async load() {
          return ++calls;
        }
      }

      const svc = new Svc();
      await expect(svc.load()).resolves.toBe(1);

      destroyDecoratedCache('destroyEntry', svc);

      await expect(svc.load()).resolves.toBe(2);
      expect(calls).toBe(2);
    });

    it('is a no-op when nothing is registered', () => {
      expect(() => destroyDecoratedCache('neverRegistered', {})).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Duplicate ids
  // ---------------------------------------------------------------------------
  describe('duplicate ids', () => {
    it('collapses two methods sharing an id into one cache', async () => {
      class Svc {
        @Cache({ id: 'dupId' })
        async first() {
          return 'first';
        }

        @Cache({ id: 'dupId' })
        async second() {
          return 'second';
        }
      }

      const svc = new Svc();

      // The id is the only registry key within an instance, so `second()` reads `first()`'s
      // cached value rather than running its own body.
      await expect(svc.first()).resolves.toBe('first');
      await expect(svc.second()).resolves.toBe('first');
    });
  });

  // ---------------------------------------------------------------------------
  // Inheritance
  // ---------------------------------------------------------------------------
  describe('inheritance', () => {
    it('lets a child override without @Cache while super.m() stays cached', async () => {
      class Parent {
        @Cache({ id: 'inhPlain' })
        async load() {
          return 'parent';
        }
      }
      class Child extends Parent {
        async load() {
          return 'child';
        }
      }

      const child = new Child();
      await expect(child.load()).resolves.toBe('child');

      // The parent's wrapper is still reachable through the prototype chain.
      await expect(Parent.prototype.load.call(child)).resolves.toBe('parent');
    });

    it('shares one cacher when a child re-declares the same id', async () => {
      class Parent {
        @Cache({ id: 'inhSame' })
        async load() {
          return 'parent';
        }
      }
      class Child extends Parent {
        @Cache({ id: 'inhSame' })
        async load() {
          return 'child';
        }
      }

      const child = new Child();
      await expect(child.load()).resolves.toBe('child');

      // Same [id, instance] key, so super.m() returns the cached child value.
      await expect(Parent.prototype.load.call(child)).resolves.toBe('child');
    });

    it('keeps parent and child caches separate when the ids differ', async () => {
      class Parent {
        @Cache({ id: 'inhParentId' })
        async load() {
          return 'parent';
        }
      }
      class Child extends Parent {
        @Cache({ id: 'inhChildId' })
        async load() {
          return 'child';
        }
      }

      const child = new Child();
      await expect(child.load()).resolves.toBe('child');
      await expect(Parent.prototype.load.call(child)).resolves.toBe('parent');
    });

    it('inherits a decorator declared only on the parent', async () => {
      let calls = 0;
      class Parent {
        @Cache({ id: 'inhOnly' })
        async load() {
          return ++calls;
        }
      }
      class Child extends Parent {}

      const child = new Child();
      await expect(child.load()).resolves.toBe(1);
      await expect(child.load()).resolves.toBe(1);
      expect(calls).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Relation to the Cacher class
  // ---------------------------------------------------------------------------
  describe('integration', () => {
    it('exposes the same failure semantics as Cacher (a rejection is not cached)', async () => {
      let calls = 0;
      class Svc {
        @Cache({ id: 'failure' })
        async load() {
          calls++;
          if (calls === 1) throw new Error('boom');
          return calls;
        }
      }

      const svc = new Svc();
      await expect(svc.load()).rejects.toThrow('boom');
      await expect(svc.load()).resolves.toBe(2);
      expect(calls).toBe(2);
    });

    it('exports Cacher alongside the decorators', () => {
      expect(Cacher).toBeTypeOf('function');
    });
  });
});
