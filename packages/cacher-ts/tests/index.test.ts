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
function observe(p: Promise<unknown> | unknown): Promise<unknown> {
  return Promise.resolve(p).catch(() => undefined);
}

const TTL = 1000;

describe('Cacher', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Basics
  // ---------------------------------------------------------------------------
  describe('basics', () => {
    it('does not invoke the getter until load() is called', () => {
      let calls = 0;
      const cacher = new Cacher(() => ++calls, TTL);

      expect(calls).toBe(0);
      expect(() => cacher.get()).toThrow(/not been initialized/);
      expect(calls).toBe(0);
    });

    it('hands the loaded value to get()', async () => {
      const cacher = new Cacher(async () => 42, TTL);

      await cacher.load();

      expect(cacher.get()).toBe(42);
    });

    it('serves the cached value without invoking the getter again', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      await cacher.load();
      cacher.get();
      cacher.get();

      expect(calls).toBe(1);
    });

    it('returns the getter result itself from load(), sync or async', async () => {
      const sync = new Cacher(() => 3, TTL);
      const async_ = new Cacher(async () => 3, TTL);

      // Sync getter: load() mirrors it and returns the value, not a promise.
      expect(sync.load()).toBe(3);
      // Async getter: load() returns the thenable.
      await expect(async_.load()).resolves.toBe(3);
    });

    it('caches an undefined value like any other', async () => {
      let calls = 0;
      const cacher = new Cacher<Record<string, never>, () => Promise<undefined>>(async () => {
        calls++;
        return undefined;
      }, TTL);

      await cacher.load();

      expect(cacher.get()).toBeUndefined();
      expect(calls).toBe(1);
    });

    it('returns the very same reference it cached (no defensive copy)', async () => {
      const cacher = new Cacher(async () => ({ list: [1, 2, 3] }), TTL);

      await cacher.load();
      const first = cacher.get();
      first.list.push(4);

      expect(cacher.get()).toBe(first);
    });
  });

  // ---------------------------------------------------------------------------
  // The getter receives the previous cache
  // ---------------------------------------------------------------------------
  describe('previous value passed to the getter', () => {
    it('passes undefined on the first load', async () => {
      const seen: (number | undefined)[] = [];
      const cacher = new Cacher((last?: number) => {
        seen.push(last);
        return 1;
      }, TTL);

      cacher.load();

      expect(seen).toEqual([undefined]);
    });

    it('passes the cached value to every later load', async () => {
      const seen: (number | undefined)[] = [];
      const cacher = new Cacher((last?: number) => {
        seen.push(last);
        return (last ?? 0) + 1;
      }, TTL);

      cacher.load(); // 1
      cacher.load(); // 2
      cacher.load(); // 3

      expect(seen).toEqual([undefined, 1, 2]);
      expect(cacher.get()).toBe(3);
    });

    it('passes the previous value to an async getter too', async () => {
      const seen: (number | undefined)[] = [];
      const cacher = new Cacher(async (last?: number) => {
        seen.push(last);
        return 7;
      }, TTL);

      await cacher.load();
      await cacher.load();

      expect(seen).toEqual([undefined, 7]);
    });

    it('passes the same reference get() hands out', async () => {
      const cacher = new Cacher<Record<string, never>, (last?: { n: number }) => { n: number }>(
        (last?: { n: number }) => (last ? (last.n++, last) : { n: 1 }),
        TTL,
      );

      cacher.load();
      const value = cacher.get();
      cacher.load();

      expect(cacher.get()).toBe(value);
      expect(cacher.get().n).toBe(2);
    });

    it('keeps the previous value when a refresh fails', async () => {
      const seen: (string | undefined)[] = [];
      let calls = 0;
      const cacher = new Cacher((last?: string) => {
        seen.push(last);
        calls++;
        if (calls === 2) throw new Error('boom');
        return `v${calls}`;
      }, TTL);

      expect(cacher.load()).toBe('v1');
      expect(() => cacher.load()).toThrow('boom');

      // The failed attempt neither cached a value nor cleared the old one.
      expect(cacher.get()).toBe('v1');
      expect(cacher.load()).toBe('v3');
      expect(seen).toEqual([undefined, 'v1', 'v1']);
    });
  });

  // ---------------------------------------------------------------------------
  // Failures
  // ---------------------------------------------------------------------------
  describe('failures', () => {
    it('does not cache a rejection and retries on the next load', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        if (calls === 1) throw new Error('boom');
        return calls;
      }, TTL);

      await expect(cacher.load()).rejects.toThrow('boom');

      await cacher.load();
      expect(cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('keeps retrying a persistently failing getter', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        throw new Error(`boom-${calls}`);
      }, TTL);

      await expect(cacher.load()).rejects.toThrow('boom-1');
      await expect(cacher.load()).rejects.toThrow('boom-2');
      await expect(cacher.load()).rejects.toThrow('boom-3');

      expect(calls).toBe(3);
    });

    it('still throws from get() while nothing has ever loaded', async () => {
      const cacher = new Cacher(async () => {
        throw new Error('boom');
      }, TTL);

      await expect(cacher.load()).rejects.toThrow('boom');

      expect(() => cacher.get()).toThrow(/not been initialized/);
    });

    it('propagates a synchronous getter error out of load()', () => {
      const cacher = new Cacher(() => {
        throw new Error('sync boom');
      }, TTL);

      expect(() => cacher.load()).toThrow('sync boom');
    });
  });

  // ---------------------------------------------------------------------------
  // ttl
  // ---------------------------------------------------------------------------
  describe('ttl', () => {
    it('returns the fresh value from get() once the ttl elapses (sync getter)', () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(() => ++calls, TTL);

      cacher.load();
      expect(cacher.get()).toBe(1);

      vi.advanceTimersByTime(TTL);

      // A sync getter reloads in place, so get() already sees the new value.
      expect(cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });

    it('hands back the stale value for one call (async getter, stale-while-revalidate)', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      await cacher.load();
      expect(cacher.get()).toBe(1);

      vi.advanceTimersByTime(TTL);

      // The refresh is only *started*; this call still reads value #1.
      expect(cacher.get()).toBe(1);
      await cacher.load();
      expect(cacher.get()).toBe(2);
    });

    it('honors a custom ttl', () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(() => ++calls, 500);

      cacher.load();

      vi.advanceTimersByTime(499);
      expect(cacher.get()).toBe(1);

      vi.advanceTimersByTime(1);
      expect(cacher.get()).toBe(2);
    });

    it('refreshes on every read when ttl is 0', () => {
      let calls = 0;
      const cacher = new Cacher(() => ++calls, 0);

      cacher.load();
      expect(cacher.get()).toBe(2);
      expect(cacher.get()).toBe(3);
      expect(calls).toBe(3);
    });

    it('never refreshes when ttl is Infinity', () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(() => ++calls, Infinity);

      cacher.load();

      vi.advanceTimersByTime(3.15e13); // ~1000 years

      expect(cacher.get()).toBe(1);
      expect(calls).toBe(1);
    });

    it('runs the ttl on the monotonic clock, so wall-clock jumps cannot expire it', () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(() => ++calls, TTL);

      cacher.load();

      // An NTP correction drags the wall clock 10 years back; performance.now()
      // is unaffected, so the entry stays fresh.
      vi.setSystemTime(-10 * 365 * 24 * 3600 * 1000);
      expect(cacher.get()).toBe(1);

      vi.advanceTimersByTime(TTL);
      expect(cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // loading / concurrency
  // ---------------------------------------------------------------------------
  describe('loading', () => {
    it('is false before anything has loaded', () => {
      const cacher = new Cacher(async () => 1, TTL);

      expect(cacher.loading).toBe(false);
    });

    it('is the in-flight promise while an async getter runs', async () => {
      const gate = deferred<number>();
      const cacher = new Cacher(() => gate.promise, TTL);

      const inFlight = cacher.load();

      expect(cacher.loading).toBe(inFlight);

      gate.resolve(1);
      await inFlight;

      expect(cacher.loading).toBe(false);
    });

    it('lets concurrent load() calls join one request', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      }, TTL);

      const first = cacher.load();
      const second = cacher.load();

      expect(calls).toBe(1);
      expect(second).toBe(first);

      gate.resolve(5);
      await expect(first).resolves.toBe(5);
      expect(cacher.loading).toBe(false);
    });

    it('clears the in-flight state after a rejection, so the next load retries', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return calls === 1 ? gate.promise : Promise.resolve(calls);
      }, TTL);

      const failing = cacher.load();
      observe(failing);
      gate.reject(new Error('offline'));
      await expect(failing).rejects.toThrow('offline');

      expect(cacher.loading).toBe(false);
      await expect(cacher.load()).resolves.toBe(2);
    });

    it('lets a caller join the background refresh that get() started', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);
      observe(cacher.load());
      await Promise.resolve();

      vi.advanceTimersByTime(TTL);
      cacher.get(); // starts the refresh, hands back value #1

      expect(cacher.loading).not.toBe(false);
      await cacher.loading; // join it instead of starting another

      expect(cacher.get()).toBe(2);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Regression: a load at monotonic time 0 is still a load
  // ---------------------------------------------------------------------------
  describe('freshness bookkeeping', () => {
    it('does not treat a load at performance.now() === 0 as never-loaded', () => {
      // `performance.now()` starts at 0, and fake timers pin it there, so an
      // `0` sentinel for "never loaded" would make the very first get() reload.
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(() => ++calls, TTL);

      expect(performance.now()).toBe(0);
      cacher.load();

      expect(cacher.get()).toBe(1);
      expect(calls).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // derive() / getSub() / removeSub()
  // ---------------------------------------------------------------------------
  describe('derive()', () => {
    it('maps the cached value', async () => {
      const cacher = new Cacher(async () => 21, TTL);
      cacher.derive('doubled', (value) => value * 2);

      await cacher.load();

      expect(cacher.getSub('doubled')).toBe(42);
    });

    it('memoizes the mapping while the parent reference is unchanged', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => ({ n: 7 }), Infinity);
      cacher.derive('n', (value) => {
        mapCalls++;
        return value.n;
      });

      await cacher.load();

      expect(cacher.getSub('n')).toBe(7);
      expect(cacher.getSub('n')).toBe(7);

      expect(mapCalls).toBe(1);
    });

    it('re-maps when the parent value changes by identity', async () => {
      let n = 0;
      const cacher = new Cacher(async () => ({ n: ++n }), Infinity);
      cacher.derive('n', (value) => value.n);

      await cacher.load();
      expect(cacher.getSub('n')).toBe(1);

      await cacher.load(); // a brand-new object
      expect(cacher.getSub('n')).toBe(2);
    });

    it('does not re-map an equal-but-same primitive', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => 'prod', Infinity);
      cacher.derive('tag', (value) => {
        mapCalls++;
        return `${value}-mapped`;
      });

      await cacher.load();
      expect(cacher.getSub('tag')).toBe('prod-mapped');

      await cacher.load(); // 'prod' again — same primitive
      expect(cacher.getSub('tag')).toBe('prod-mapped');
      expect(mapCalls).toBe(1);
    });

    it('throws on an unregistered name rather than returning undefined', async () => {
      const cacher = new Cacher(async () => 1, TTL);
      await cacher.load();

      expect(() => cacher.getSub('nope')).toThrow(/No derived cache/);
    });

    it('throws when read before the parent cache exists', () => {
      const cacher = new Cacher(async () => 1, TTL);
      cacher.derive('n', (value) => value);

      expect(() => cacher.getSub('n')).toThrow(/not initialized/);
    });

    it('propagates a mapping failure and retries the mapping next read', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => 1, Infinity);
      cacher.derive('boom', () => {
        mapCalls++;
        throw new Error('map boom');
      });

      await cacher.load();

      expect(() => cacher.getSub('boom')).toThrow('map boom');
      expect(() => cacher.getSub('boom')).toThrow('map boom');
      expect(mapCalls).toBe(2);
    });

    it('reads the parent current value without triggering a reload', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);
      cacher.derive('n', (value) => value);

      await cacher.load();
      vi.advanceTimersByTime(TTL);

      expect(cacher.getSub('n')).toBe(1);
      expect(calls).toBe(1);
    });
  });

  describe('removeSub()', () => {
    it('drops a registered sub-cache', async () => {
      const cacher = new Cacher(async () => 1, TTL);
      cacher.derive('n', (value) => value);

      await cacher.load();

      expect(cacher.removeSub('n')).toBe(true);
      expect(() => cacher.getSub('n')).toThrow(/No derived cache/);
    });

    it('returns false for a name that was never registered', () => {
      const cacher = new Cacher(async () => 1, TTL);

      expect(cacher.removeSub('nope')).toBe(false);
    });
  });
});
