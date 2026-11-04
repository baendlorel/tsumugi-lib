import { isDeepStrictEqual } from 'node:util';
import { Cacher } from '../src/index.js';

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

// #region ttl of derived values
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
