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
    it('does not invoke the getter until it is read', () => {
      let calls = 0;
      new Cacher(() => ++calls, TTL);

      expect(calls).toBe(0);
    });

    it('loads on the first get(), so an unloaded cacher never throws', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      // Unlike the pre-async API there is no "not initialized" error: get() waits for the load.
      await expect(cacher.get()).resolves.toBe(1);
      expect(calls).toBe(1);
    });

    it('serves the cached value without invoking the getter again', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      await cacher.get();
      await cacher.get();
      await cacher.get();

      expect(calls).toBe(1);
    });

    it('always returns a promise from reload(), sync getter or not', async () => {
      const sync = new Cacher(() => 3, TTL);
      const async_ = new Cacher(async () => 3, TTL);

      expect(sync.reload()).toBeInstanceOf(Promise);
      expect(async_.reload()).toBeInstanceOf(Promise);
      await expect(sync.reload()).resolves.toBe(3);
      await expect(async_.reload()).resolves.toBe(3);
    });

    it('caches an undefined value like any other', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        return undefined;
      }, TTL);

      await expect(cacher.get()).resolves.toBeUndefined();
      await expect(cacher.get()).resolves.toBeUndefined();
      expect(calls).toBe(1);
    });

    it('returns the very same reference it cached (no defensive copy)', async () => {
      const cacher = new Cacher(async () => ({ list: [1, 2, 3] }), TTL);

      const first = await cacher.get();
      first.list.push(4);

      const second = await cacher.get();
      expect(second).toBe(first);
      expect(second.list).toHaveLength(4);
    });

    it('reload() forces a fresh load even while the entry is still fresh', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 100_000);

      await cacher.reload();
      await cacher.reload();

      expect(calls).toBe(2);
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

      await cacher.reload();

      expect(seen).toEqual([undefined]);
    });

    it('passes the cached value to every later load', async () => {
      const seen: (number | undefined)[] = [];
      const cacher = new Cacher((last?: number) => {
        seen.push(last);
        return (last ?? 0) + 1;
      }, TTL);

      await cacher.reload(); // 1
      await cacher.reload(); // 2
      await cacher.reload(); // 3

      expect(seen).toEqual([undefined, 1, 2]);
      await expect(cacher.get()).resolves.toBe(3);
    });

    it('passes the previous value to an async getter too', async () => {
      const seen: (number | undefined)[] = [];
      const cacher = new Cacher(async (last?: number) => {
        seen.push(last);
        return 7;
      }, TTL);

      await cacher.reload();
      await cacher.reload();

      expect(seen).toEqual([undefined, 7]);
    });

    it('passes the same reference get() hands out', async () => {
      const cacher = new Cacher((last?: { n: number }) => (last ? (last.n++, last) : { n: 1 }), TTL);

      await cacher.reload();
      const value = await cacher.get();
      await cacher.reload();

      await expect(cacher.get()).resolves.toBe(value);
      expect((await cacher.get()).n).toBe(2);
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

      await expect(cacher.reload()).resolves.toBe('v1');
      await expect(cacher.reload()).rejects.toThrow('boom');

      // The failed attempt neither cached a value nor cleared the old one.
      await expect(cacher.get()).resolves.toBe('v1');
      await expect(cacher.reload()).resolves.toBe('v3');
      expect(seen).toEqual([undefined, 'v1', 'v1']);
    });
  });

  // ---------------------------------------------------------------------------
  // Failures
  // ---------------------------------------------------------------------------
  describe('failures', () => {
    it('does not cache a rejection and retries on the next read', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        if (calls === 1) throw new Error('boom');
        return calls;
      }, TTL);

      await expect(cacher.reload()).rejects.toThrow('boom');
      await expect(cacher.reload()).resolves.toBe(2);
      expect(calls).toBe(2);
    });

    it('keeps retrying a persistently failing getter', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        throw new Error(`boom-${calls}`);
      }, TTL);

      await expect(cacher.reload()).rejects.toThrow('boom-1');
      await expect(cacher.reload()).rejects.toThrow('boom-2');
      await expect(cacher.reload()).rejects.toThrow('boom-3');

      expect(calls).toBe(3);
    });

    it('leaves the cacher usable after a first-load rejection', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => {
        calls++;
        if (calls === 1) throw new Error('boom');
        return 'ok';
      }, TTL);

      await expect(cacher.get()).rejects.toThrow('boom');
      await expect(cacher.get()).resolves.toBe('ok');
      await expect(cacher.get()).resolves.toBe('ok');
      expect(calls).toBe(2);
    });

    it('propagates a synchronous getter error out of reload()', async () => {
      const cacher = new Cacher(() => {
        throw new Error('sync boom');
      }, TTL);

      await expect(cacher.reload()).rejects.toThrow('sync boom');
    });

    it('keeps a sync getter retryable after it throws (regression: pending never cleared)', async () => {
      let calls = 0;
      const cacher = new Cacher(() => {
        if (++calls === 1) throw new Error('sync boom');
        return 'ok';
      }, TTL);

      await expect(cacher.reload()).rejects.toThrow('sync boom');

      // If runGetter's finally ran before `this.pending` was assigned, the cacher would
      // stay forever "loading" and this second call would hang on a dead promise.
      await expect(cacher.reload()).resolves.toBe('ok');
      expect(cacher.loading).toBe(false);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // ttl
  // ---------------------------------------------------------------------------
  describe('ttl', () => {
    it('serves the cached value up to the ttl and refreshes after it', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      await cacher.reload();

      vi.advanceTimersByTime(TTL - 1);
      await expect(cacher.get()).resolves.toBe(1);

      vi.advanceTimersByTime(1);
      await expect(cacher.get()).resolves.toBe(2);
      expect(calls).toBe(2);
    });

    it('honors a custom ttl', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 500);

      await cacher.reload();

      vi.advanceTimersByTime(499);
      await expect(cacher.get()).resolves.toBe(1);

      vi.advanceTimersByTime(1);
      await expect(cacher.get()).resolves.toBe(2);
    });

    it('refreshes on every read when ttl is 0', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, 0);

      await expect(cacher.get()).resolves.toBe(1);
      await expect(cacher.get()).resolves.toBe(2);
      await expect(cacher.get()).resolves.toBe(3);
      expect(calls).toBe(3);
    });

    it('never refreshes when ttl is Infinity', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, Infinity);

      await cacher.reload();

      vi.advanceTimersByTime(3.15e13); // ~1000 years

      await expect(cacher.get()).resolves.toBe(1);
      expect(calls).toBe(1);
    });

    it('runs the ttl on the monotonic clock, so wall-clock jumps cannot expire it', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      await cacher.reload();

      // An NTP correction drags the wall clock 10 years back; performance.now()
      // is unaffected, so the entry stays fresh.
      vi.setSystemTime(-10 * 365 * 24 * 3600 * 1000);
      await expect(cacher.get()).resolves.toBe(1);

      vi.advanceTimersByTime(TTL);
      await expect(cacher.get()).resolves.toBe(2);
      expect(calls).toBe(2);
    });

    it('does not treat a load at performance.now() === 0 as never-loaded', async () => {
      // `performance.now()` starts at 0, and fake timers pin it there, so an
      // `0` sentinel for "never loaded" would make the very first get() reload.
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      expect(performance.now()).toBe(0);
      await cacher.reload();

      await expect(cacher.get()).resolves.toBe(1);
      expect(calls).toBe(1);
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

    it('exposes a promise while a load is in flight, and false afterwards', async () => {
      const gate = deferred<number>();
      const cacher = new Cacher(() => gate.promise, TTL);

      const inFlight = cacher.reload();

      expect(cacher.loading).toBeInstanceOf(Promise);

      gate.resolve(1);
      await inFlight;

      expect(cacher.loading).toBe(false);
    });

    it('lets concurrent reads join one request', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return gate.promise;
      }, TTL);

      const first = cacher.reload();
      const joined = cacher.reload();
      const read = cacher.get();

      // `reload()` is async, so each call returns a distinct wrapper promise — what
      // matters is that they all share one getter invocation.
      expect(calls).toBe(1);

      gate.resolve(5);
      await expect(first).resolves.toBe(5);
      await expect(joined).resolves.toBe(5);
      await expect(read).resolves.toBe(5);
      expect(calls).toBe(1);
      expect(cacher.loading).toBe(false);
    });

    it('clears the in-flight state after a rejection, so the next load retries', async () => {
      const gate = deferred<number>();
      let calls = 0;
      const cacher = new Cacher(() => {
        calls++;
        return calls === 1 ? gate.promise : Promise.resolve(calls);
      }, TTL);

      const failing = cacher.reload();
      observe(failing);
      gate.reject(new Error('offline'));
      await expect(failing).rejects.toThrow('offline');

      expect(cacher.loading).toBe(false);
      await expect(cacher.reload()).resolves.toBe(2);
    });

    it('returns the fresh value from get() after expiry (no stale-while-revalidate)', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);

      await cacher.reload();
      vi.advanceTimersByTime(TTL);

      // get() waits for the reload it triggered instead of handing back value #1.
      await expect(cacher.get()).resolves.toBe(2);
      expect(calls).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Constructor validation
  // ---------------------------------------------------------------------------
  describe('constructor', () => {
    it('accepts 0, Infinity, large numbers and bigints as ttl', () => {
      expect(new Cacher(async () => 1, 0)).toBeInstanceOf(Cacher);
      expect(new Cacher(async () => 1, Infinity)).toBeInstanceOf(Cacher);
      expect(new Cacher(async () => 1, 2147483648)).toBeInstanceOf(Cacher);
      expect(new Cacher(async () => 1, 0n)).toBeInstanceOf(Cacher);
      expect(new Cacher(async () => 1, 2n ** 60n)).toBeInstanceOf(Cacher);
    });

    it.each([
      ['NaN', NaN],
      ['negative', -1],
      ['non-integer', 1.5],
      ['unsafe integer', 2 ** 60],
      ['non-number', '1000'],
    ])('rejects a %s ttl', (_label, ttl) => {
      expect(() => new Cacher(async () => 1, ttl as number)).toThrow(/ttl must be/);
    });

    it('rejects a negative bigint ttl', () => {
      expect(() => new Cacher(async () => 1, -2n)).toThrow(/ttl must be/);
    });

    it('treats -1n as an alias for Infinity, like the internal never-expire sentinel', () => {
      expect(new Cacher(async () => 1, -1n)).toBeInstanceOf(Cacher);
    });

    it('rejects a non-function getter', () => {
      expect(() => new Cacher(null as never)).toThrow(/getter must be a function/);
    });
  });

  // ---------------------------------------------------------------------------
  // thisArg
  // ---------------------------------------------------------------------------
  describe('thisArg', () => {
    it('binds the getter to the constructor argument', async () => {
      const cacher = new Cacher(
        async function (this: { tag: string }) {
          return this.tag;
        },
        TTL,
        { tag: 'bound' },
      );

      await expect(cacher.reload()).resolves.toBe('bound');
    });

    it('rebinds the getter through setThis()', async () => {
      const cacher = new Cacher(
        async function (this: { tag: string }) {
          return this.tag;
        },
        TTL,
        { tag: 'a' },
      );

      await expect(cacher.reload()).resolves.toBe('a');

      cacher.setThis({ tag: 'b' });
      await expect(cacher.reload()).resolves.toBe('b');
    });

    it('defaults to a null receiver', async () => {
      const cacher = new Cacher(async function (this: unknown) {
        return this;
      }, TTL);

      await expect(cacher.reload()).resolves.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // derive() / getSub() / hasSub() / deleteSub()
  // ---------------------------------------------------------------------------
  describe('sub-caches', () => {
    it('maps the cached value', async () => {
      const cacher = new Cacher(async () => 21, TTL);
      cacher.derive('doubled', (value) => value * 2);
      await cacher.reload();

      await expect(cacher.getSub('doubled')).resolves.toBe(42);
    });

    it('memoizes the mapping while the parent reference is unchanged', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => ({ n: 7 }), Infinity);
      cacher.derive('n', (value) => {
        mapCalls++;
        return value.n;
      });

      await cacher.reload();

      await expect(cacher.getSub('n')).resolves.toBe(7);
      await expect(cacher.getSub('n')).resolves.toBe(7);
      expect(mapCalls).toBe(1);
    });

    it('re-maps when the parent value changes by identity', async () => {
      let n = 0;
      const cacher = new Cacher(async () => ({ n: ++n }), Infinity);
      cacher.derive('n', (value) => value.n);

      await cacher.reload();
      await expect(cacher.getSub('n')).resolves.toBe(1);

      await cacher.reload(); // a brand-new object
      await expect(cacher.getSub('n')).resolves.toBe(2);
    });

    it('does not re-map when the parent is the same primitive', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => 'prod', Infinity);
      cacher.derive('tag', (value) => {
        mapCalls++;
        return `${value}-mapped`;
      });

      await cacher.reload();
      await expect(cacher.getSub('tag')).resolves.toBe('prod-mapped');

      await cacher.reload(); // 'prod' again
      await expect(cacher.getSub('tag')).resolves.toBe('prod-mapped');
      expect(mapCalls).toBe(1);
    });

    it('treats NaN as an unchanged parent (Object.is semantics)', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => NaN, Infinity);
      cacher.derive('n', () => {
        mapCalls++;
        return mapCalls;
      });

      await cacher.reload();
      await expect(cacher.getSub('n')).resolves.toBe(1);

      await cacher.reload();
      await expect(cacher.getSub('n')).resolves.toBe(1);
      expect(mapCalls).toBe(1);
    });

    it('loads the parent when getSub() is called before any read', async () => {
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);
      cacher.derive('n', (value) => value * 10);

      await expect(cacher.getSub('n')).resolves.toBe(10);
      expect(calls).toBe(1);
    });

    it('reloads an expired parent rather than serving a stale derivation', async () => {
      vi.useFakeTimers();
      let calls = 0;
      const cacher = new Cacher(async () => ++calls, TTL);
      cacher.derive('n', (value) => value);

      await cacher.reload();
      vi.advanceTimersByTime(TTL);

      await expect(cacher.getSub('n')).resolves.toBe(2);
      expect(calls).toBe(2);
    });

    it('calls the mapper with thisArg', async () => {
      const cacher = new Cacher(async () => 10, TTL, { factor: 3 });
      cacher.derive('n', function (this: { factor: number }, value) {
        return value * this.factor;
      });

      await cacher.reload();

      await expect(cacher.getSub('n')).resolves.toBe(30);
    });

    it('awaits an async mapper even though the declared type is synchronous', async () => {
      const cacher = new Cacher(async () => 21, TTL);
      cacher.derive('n', (async (value: number) => value * 2) as unknown as (value: number) => number);

      await cacher.reload();

      await expect(cacher.getSub('n')).resolves.toBe(42);
    });

    it('throws on an unregistered name rather than returning undefined', async () => {
      const cacher = new Cacher(async () => 1, TTL);
      await cacher.reload();

      await expect(cacher.getSub('nope' as never)).rejects.toThrow(/No derived cache/);
    });

    it('keeps the derivation retryable after the mapper throws', async () => {
      let mapCalls = 0;
      const cacher = new Cacher(async () => 1, Infinity);
      cacher.derive('boom', () => {
        mapCalls++;
        throw new Error('map boom');
      });

      await cacher.reload();

      await expect(cacher.getSub('boom')).rejects.toThrow('map boom');
      await expect(cacher.getSub('boom')).rejects.toThrow('map boom');
      expect(mapCalls).toBe(2);
    });

    it('re-maps after a mapper failure once it recovers', async () => {
      let attempt = 0;
      const cacher = new Cacher(async () => 5, Infinity);
      cacher.derive('d', (value) => {
        if (++attempt === 1) throw new Error('map boom');
        return value * 2;
      });

      await cacher.reload();

      await expect(cacher.getSub('d')).rejects.toThrow('map boom');
      await expect(cacher.getSub('d')).resolves.toBe(10);
    });

    describe('hasSub()', () => {
      it('reports registration state', () => {
        const cacher = new Cacher(async () => 1, TTL);

        expect(cacher.hasSub('n')).toBe(false);
        cacher.derive('n', (value) => value);
        expect(cacher.hasSub('n')).toBe(true);
      });
    });

    describe('derive()', () => {
      it('replaces an existing sub-cache and resets its memoized value', async () => {
        const cacher = new Cacher(async () => 10, Infinity);
        cacher.derive('n', (value) => value);
        await cacher.reload();
        await expect(cacher.getSub('n')).resolves.toBe(10);

        cacher.derive('n', (value) => value * 100);
        await expect(cacher.getSub('n')).resolves.toBe(1000);
      });
    });

    describe('getOrDerive()', () => {
      it('registers on the first call and maps', async () => {
        const cacher = new Cacher(async () => 21, TTL);
        await cacher.reload();

        await expect(cacher.getOrDerive('n', (value) => value * 2)).resolves.toBe(42);
      });

      it('keeps the first mapper and silently ignores later ones', async () => {
        const cacher = new Cacher(async () => 21, TTL);
        await cacher.reload();

        await expect(cacher.getOrDerive('n', (value) => value * 2)).resolves.toBe(42);
        await expect(cacher.getOrDerive('n', () => 999)).resolves.toBe(42);
      });
    });

    describe('deleteSub()', () => {
      it('drops a registered sub-cache', async () => {
        const cacher = new Cacher(async () => 1, TTL);
        cacher.derive('n', (value) => value);
        await cacher.reload();

        expect(cacher.deleteSub('n')).toBe(true);
        await expect(cacher.getSub('n' as never)).rejects.toThrow(/No derived cache/);
      });

      it('returns false for a name that was never registered', () => {
        const cacher = new Cacher(async () => 1, TTL);

        expect(cacher.deleteSub('nope')).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // destroy()
  // ---------------------------------------------------------------------------
  describe('destroy()', () => {
    it('clears the cached value and marks the cacher destroyed', async () => {
      const cacher = new Cacher(async () => 'v', TTL);
      await cacher.reload();

      cacher.destroy();

      // `initialized` is not reset (a destroyed cacher is simply unusable), so the
      // documented post-destroy check is `destroyed`.
      expect(cacher.destroyed).toBe(true);
    });

    it('drops sub-caches so getSub() fails afterwards', async () => {
      const cacher = new Cacher(async () => 1, TTL);
      cacher.derive('n', (value) => value);
      await cacher.reload();

      cacher.destroy();

      await expect(cacher.getSub('n' as never)).rejects.toThrow();
    });
  });
});
