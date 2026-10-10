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

/** Swallows the rejection of a promise we only keep around to observe. */
function observe(p: Promise<unknown>): Promise<unknown> {
  return p.catch(() => undefined);
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

    it('keeps retrying a persistently failing getter', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        throw new Error(`boom-${calls}`);
      });

      await expect(cacher.get()).rejects.toThrow('boom-1');
      await expect(cacher.get()).rejects.toThrow('boom-2');
      await expect(cacher.get()).rejects.toThrow('boom-3');

      expect(calls).toBe(3);
    });

    it('recovers once the getter starts succeeding again', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        if (calls <= 2) {
          throw new Error('flaky');
        }
        return 'ok';
      });

      await expect(cacher.get()).rejects.toThrow('flaky');
      await expect(cacher.get()).rejects.toThrow('flaky');
      expect(await cacher.get()).toBe('ok');

      // The recovered value is cached.
      expect(await cacher.get()).toBe('ok');
      expect(calls).toBe(3);
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

    it('starts exactly one request for many concurrent callers', async () => {
      const gate = deferred<string>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      });

      const all = Array.from({ length: 5 }, () => cacher.get());
      gate.resolve('done');

      expect(await Promise.all(all)).toEqual(['done', 'done', 'done', 'done', 'done']);
      expect(calls).toBe(1);
    });

    it('does not leave a permanent rejection behind after a failure', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return calls === 1 ? gate.promise : Promise.resolve(calls);
      });

      const failed = cacher.get();
      gate.reject(new Error('offline'));
      await expect(failed).rejects.toThrow('offline');

      // The rejected promise must not be handed out forever.
      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('does not warn about an unhandled rejection when callers arrive late', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        throw new Error('boom');
      });

      // A second caller attaches to the pending promise before it settles.
      const first = observe(cacher.get());
      const second = observe(cacher.get());

      await Promise.all([first, second]);
      expect(calls).toBe(1);
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

    it('tracks ttl from the moment the getter settles, not from the moment it starts', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const gate = deferred<number>();
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      }, 1000);

      const inFlight = cacher.get();
      vi.advanceTimersByTime(900); // the getter is slow: 900ms of the ttl budget spent fetching
      gate.resolve(1);
      await inFlight;

      // 900ms elapsed since the fetch *started*; the window must still be full.
      vi.advanceTimersByTime(900);
      expect(await cacher.get()).toBe(1);
      expect(calls).toBe(1);
    });

    it('refreshes when ttl elapses even if the clock jumped backwards', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 1000);

      await cacher.get();

      // An NTP correction drags the clock before the last fetch time.
      vi.useFakeTimers();
      vi.setSystemTime(-10 * 365 * 24 * 3600 * 1000);

      expect(await cacher.get()).toBe(2);
      expect(calls).toBe(2);
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

    it('maps concurrently exactly once when the source is still in flight', async () => {
      const gate = deferred<number>();
      let calls = 0;
      let mapCalls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      });
      const doubled = cacher.derive((value) => {
        mapCalls++;
        return value * 2;
      });

      const all = [doubled.get(), doubled.get(), doubled.get()];
      gate.resolve(21);

      expect(await Promise.all(all)).toEqual([42, 42, 42]);
      expect(calls).toBe(1);
      expect(mapCalls).toBe(1);
    });

    it('re-maps after the source failed and recovered', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        if (calls === 1) {
          throw new Error('boom');
        }
        return calls;
      });
      const doubled = cacher.derive((value) => value * 2);

      await expect(doubled.get()).rejects.toThrow('boom');
      expect(await doubled.get()).toBe(4);
    });

    it('propagates a mapping failure and retries the mapping next time', async () => {
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
