import { afterEach, describe, expect, it, vi } from 'vitest';
import { Cacher } from '../src/index.js';

/** A promise whose settlement is controlled by the test. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Cacher', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Basic caching
  // ---------------------------------------------------------------------------
  describe('basic caching', () => {
    it('invokes the getter on the first get()', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls);

      expect(await cacher.get()).toBe(1);
      expect(calls).toBe(1);
    });

    it('serves the cached value without invoking the getter again', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls);

      await cacher.get();
      await cacher.get();
      await cacher.get();

      expect(calls).toBe(1);
    });

    it('caches an undefined value like any other', async () => {
      let calls = 0;
      const cacher = new Cacher<number | undefined>(async () => {
        calls++;
        return undefined;
      });

      expect(await cacher.get()).toBeUndefined();
      expect(await cacher.get()).toBeUndefined();

      expect(calls).toBe(1);
    });

    it('returns the very same reference it cached (no defensive copy)', async () => {
      const cacher = new Cacher(async () => ({ list: [1, 2, 3] }));

      const first = await cacher.get();
      first.list.push(4);

      expect(await cacher.get()).toBe(first);
      expect((await cacher.get()).list).toEqual([1, 2, 3, 4]);
    });
  });

  // ---------------------------------------------------------------------------
  // Failures
  // ---------------------------------------------------------------------------
  describe('failures', () => {
    it('does not cache a rejection and retries on the next call', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        if (calls === 1) {
          throw new Error('boom');
        }
        return calls;
      });

      await expect(cacher.get()).rejects.toThrow('boom');

      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Concurrency
  // ---------------------------------------------------------------------------
  describe('concurrent get()', () => {
    it('shares a single in-flight request between callers', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      });

      const first = cacher.get();
      const second = cacher.get();

      expect(calls).toBe(1);

      gate.resolve(42);

      expect(await first).toBe(42);
      expect(await second).toBe(42);
      expect(calls).toBe(1);

      // The shared result is cached as well.
      expect(await cacher.get()).toBe(42);
      expect(calls).toBe(1);
    });

    it('invokes the getter once for many concurrent callers', async () => {
      const gate = deferred<string>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      });

      const all = Promise.all([cacher.get(), cacher.get(), cacher.get()]);
      gate.resolve('done');

      expect(await all).toEqual(['done', 'done', 'done']);
      expect(calls).toBe(1);
    });

    it('shares a rejection between concurrent callers', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return calls === 1 ? gate.promise : Promise.resolve(calls);
      });

      const first = cacher.get();
      const second = cacher.get();
      gate.reject(new Error('offline'));

      await expect(first).rejects.toThrow('offline');
      await expect(second).rejects.toThrow('offline');

      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('starts a single new request when callers arrive after clear()', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls);

      expect(await cacher.get()).toBe(1);

      cacher.clear();

      const [a, b] = await Promise.all([cacher.get(), cacher.get()]);

      expect(calls).toBe(2);
      expect([a, b]).toEqual([2, 2]);
    });
  });

  // ---------------------------------------------------------------------------
  // clear()
  // ---------------------------------------------------------------------------
  describe('clear()', () => {
    it('forces a refresh on the next get()', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls);

      await cacher.get();
      cacher.clear();

      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('resolves clear() only after the in-flight request ahead of it settles', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return calls === 1 ? gate.promise : Promise.resolve(calls);
      });

      const inFlight = cacher.get();
      const cleared = cacher.clear();

      let clearedYet = false;
      void cleared.then(() => (clearedYet = true));

      // clear() is still queued behind the in-flight get.
      expect(clearedYet).toBe(false);

      gate.resolve(1);
      expect(await inFlight).toBe(1);

      // Once clear() settles, the cached value is gone: the next get() refetches.
      await cleared;
      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('discards a request that was in flight when cleared', async () => {
      let calls = 0;
      let settle!: (value: number) => void;
      const cacher = new Cacher(
        () =>
          new Promise<number>((resolve) => {
            calls++;
            settle = resolve;
          }),
      );

      const inFlight = cacher.get();
      cacher.clear();
      settle(1);

      // The caller still receives the value it asked for...
      expect(await inFlight).toBe(1);

      // ...but clear() wins: the value was not cached, so the retry refetches.
      const retry = cacher.get();
      settle(2);

      expect(await retry).toBe(2);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // ttl
  // ---------------------------------------------------------------------------
  describe('ttl', () => {
    it('keeps the value fresh for the whole window (default 24h)', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls);

      expect(await cacher.get()).toBe(1);

      vi.advanceTimersByTime(86_399_999);

      expect(await cacher.get()).toBe(1);
      expect(calls).toBe(1);
    });

    it('refreshes at the exact ttl boundary', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 1000);

      await cacher.get();

      vi.advanceTimersByTime(1000);

      expect(await cacher.get()).toBe(2);
    });

    it('honors a custom ttl', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 500);

      await cacher.get();

      vi.advanceTimersByTime(499);
      expect(await cacher.get()).toBe(1);

      vi.advanceTimersByTime(1);
      expect(await cacher.get()).toBe(2);
    });

    it('refreshes on every call when ttl is 0', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 0);

      expect(await cacher.get()).toBe(1);
      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('never refreshes when ttl is Infinity', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, Infinity);

      await cacher.get();

      vi.advanceTimersByTime(3.15e13); // ~1000 years

      expect(await cacher.get()).toBe(1);
      expect(calls).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // derive()
  // ---------------------------------------------------------------------------
  describe('derive()', () => {
    it('maps the value of the cacher it derives from', async () => {
      const cacher = new Cacher(async () => 21);
      const doubled = cacher.derive((value) => value * 2);

      expect(await doubled.get()).toBe(42);
    });

    it('caches the derived value without reading the source again', async () => {
      vi.useFakeTimers();
      let sourceCalls = 0;
      let mapCalls = 0;
      const cacher = new Cacher(async () => ++sourceCalls, 1000);
      const doubled = cacher.derive((value) => {
        mapCalls++;
        return value * 2;
      });

      expect(await doubled.get()).toBe(2);
      expect(await doubled.get()).toBe(2);
      expect(await doubled.get()).toBe(2);

      expect(mapCalls).toBe(1);
      expect(sourceCalls).toBe(1);
    });

    it('keeps the derived value while the source has not changed', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => 7, Infinity);
      const derived = cacher.derive((value) => {
        mapCalls++;
        return value;
      });

      await derived.get();
      await cacher.get();
      await derived.get();

      expect(mapCalls).toBe(1);
    });

    it('recomputes when the source is refreshed', async () => {
      vi.useFakeTimers();
      let n = 0;
      const cacher = new Cacher(async () => ++n, 1000);
      const tenfold = cacher.derive((value) => value * 10);

      expect(await tenfold.get()).toBe(10);

      vi.advanceTimersByTime(1000);
      // Someone else reads the source: it refreshes to 2.
      expect(await cacher.get()).toBe(2);

      expect(await tenfold.get()).toBe(20);
      expect(n).toBe(2);
    });

    it('recomputes when the source expires', async () => {
      vi.useFakeTimers();
      let n = 0;
      const cacher = new Cacher(async () => ++n, 1000);
      const tenfold = cacher.derive((value) => value * 10);

      expect(await tenfold.get()).toBe(10);

      vi.advanceTimersByTime(1000);

      // Reading the derived cacher refreshes the source it depends on.
      expect(await tenfold.get()).toBe(20);
      expect(n).toBe(2);
    });

    it('recomputes when the source is cleared', async () => {
      let n = 0;
      const cacher = new Cacher(async () => ++n);
      const tenfold = cacher.derive((value) => value * 10);

      expect(await tenfold.get()).toBe(10);

      cacher.clear();

      expect(await tenfold.get()).toBe(20);
    });

    it('does not cache a derived value when the mapping throws', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => 1, Infinity);
      const derived = cacher.derive<number>(() => {
        mapCalls++;
        throw new Error('map boom');
      });

      await expect(derived.get()).rejects.toThrow('map boom');

      await expect(derived.get()).rejects.toThrow('map boom');
      expect(mapCalls).toBe(2);
    });
  });
});
