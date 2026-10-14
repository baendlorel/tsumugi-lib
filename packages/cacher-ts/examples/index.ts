import { isDeepStrictEqual } from 'node:util';
import { Cacher, Cache, SubCache } from '../src/index.js';
import { initializeDecoratedCaches } from '../src/decorator.js';

// Ids such as `严重-1 c` refer to problems.txt.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function check(name: string, expected: unknown, fn: () => unknown) {
  let actual: unknown;
  try {
    actual = await fn();
  } catch (e) {
    actual = `throws: ${(e as Error).message}`;
  }

  if (isDeepStrictEqual(actual, expected)) {
    console.log(`✓ ${name}`);
  } else {
    process.exitCode = 1;
    console.log(`✗ ${name}\n    expected:`, expected, '\n    actual:  ', actual);
  }
}

// #region @Cache / @SubCache wiring
await check('@Cache + @SubCache in the same class', { a: { v: 1 }, b: 10 }, async () => {
  let n = 0;
  class A {
    @Cache({ id: 'a' })
    async a() {
      return { v: ++n };
    }

    @SubCache('a')
    async b(x?: { v: number }) {
      return x!.v * 10;
    }
  }
  const o = new A();
  await initializeDecoratedCaches();
  return { a: await o.a(), b: await o.b() };
});

await check('@SubCache declared before @Cache', 2, async () => {
  class A {
    @SubCache('a')
    async b(x?: number) {
      return x! + 1;
    }

    @Cache({ id: 'a' })
    async a() {
      return 1;
    }
  }
  const o = new A();
  await initializeDecoratedCaches();
  return o.b();
});

await check('parent @Cache + child @SubCache', 10, async () => {
  class P {
    @Cache({ id: 'p' })
    async p() {
      return 5;
    }
  }
  class C extends P {
    @SubCache('p')
    async s(x?: number) {
      return x! * 2;
    }
  }
  const o = new C();
  await initializeDecoratedCaches();
  return o.s();
});

await check('严重-1 c: parent @SubCache + child @Cache', 42, async () => {
  class Base {
    @SubCache('src')
    async view(x?: number) {
      return x! * 2;
    }
  }
  class Impl extends Base {
    @Cache({ id: 'src' })
    async src() {
      return 21;
    }
  }
  const o = new Impl();
  await initializeDecoratedCaches();
  return o.view();
});

await check('one cache per instance', [1, 2], async () => {
  let k = 0;
  class A {
    id = ++k;

    @Cache({ id: 'a' })
    async a() {
      return this.id;
    }
  }
  const x = new A();
  const y = new A();
  await initializeDecoratedCaches();
  return [await x.a(), await y.a()];
});

await check('duplicate id in the same class', 'throws: Duplicate cache id "k" for the same instance.', () => {
  class A {
    @Cache({ id: 'k' })
    async a() {
      return 1;
    }

    @Cache({ id: 'k' })
    async b() {
      return 2;
    }
  }
  new A();
});

await check('严重-1 b: @SubCache without any @Cache', 'throws: Cacher "a" not found.', () => {
  class A {
    @SubCache('a')
    async b(x?: number) {
      return x;
    }
  }
  return new A().b();
});
// #endregion

// #region ttl of derived values
await check('高-1: @SubCache reloads the expired parent', { first: 1, second: 2, calls: 2 }, async () => {
  let calls = 0;
  class A {
    @Cache({ id: 'a', ttl: 20 })
    async a() {
      return { v: ++calls };
    }

    @SubCache('a')
    async b(x?: { v: number }) {
      return x!.v;
    }
  }
  const o = new A();
  await initializeDecoratedCaches();
  const first = await o.b();
  await sleep(40);
  const second = await o.b();
  return { first, second, calls };
});

await check('高-1: Cacher.getSub reloads the expired parent', { first: 1, second: 2, calls: 2 }, async () => {
  let calls = 0;
  const c = new Cacher(async () => ({ v: ++calls }), 20);
  c.derive('v', (x) => x.v);
  await c.reload();
  const first = await c.getSub('v');
  await sleep(40);
  const second = await c.getSub('v');
  return { first, second, calls };
});
// #endregion

// #region sync getters
await check('中-1: sync getter that throws stays retryable', { first: 'throws: boom', second: 'ok', calls: 2 }, async () => {
  let calls = 0;
  const c = new Cacher(() => {
    if (++calls === 1) throw new Error('boom');
    return 'ok';
  }, 1000);
  const first = await c.reload().then((v) => v, (e: Error) => `throws: ${e.message}`);
  const second = await c.reload().then((v) => v, (e: Error) => `throws: ${e.message}`);
  return { first, second, calls };
});

await check('中-1: sync getter with ttl expires', [1, 2], async () => {
  let calls = 0;
  const c = new Cacher(() => ++calls, 20);
  await c.reload();
  const first = await c.get();
  await sleep(40);
  const second = await c.get();
  return [first, second];
});

await check('中-5: get() during the first load waits for it', 'loaded', async () => {
  const c = new Cacher(async () => 'loaded', 1000);
  c.reload(); // not awaited: the first load is in flight
  return c.get();
});
// #endregion
