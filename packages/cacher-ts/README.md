# cacher-ts

[![npm version](https://img.shields.io/npm/v/cacher-ts.svg)](https://www.npmjs.com/package/cacher-ts) [![npm downloads](http://img.shields.io/npm/dm/cacher-ts.svg)](https://npmcharts.com/compare/cacher-ts,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/cacher-ts?utm_source=github.com&utm_medium=referral&utm_content=Borewit/cacher-ts&utm_campaign=Badge_Grade)

A tiny cache for TypeScript with a **synchronous read path**: an async getter fills the cache, `get()` reads it without returning a promise, expiry refreshes in the background, and derived views recompute only when their source actually changes.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)


## 📦 Installation

```bash
npm install cacher-ts
# or
pnpm add cacher-ts
```

## ✨ Features

- **Sync reads, async fills.** `get()` is a plain getter that returns `T`, not `Promise<T>`. Awaiting is only ever needed when you *want* to wait — which keeps the hot path free of promises.
- **No fetch on construction.** The constructor is free of side effects. You decide when the first load happens by calling `load()`.
- **The getter sees the previous value.** It is called as `getter(lastValue)`: `undefined` on the first load, otherwise whatever is currently cached. Refresh by *updating* the old value instead of replacing it — see [The getter receives the previous value](#the-getter-receives-the-previous-value).
- **One in-flight request per cacher.** A flood of concurrent `get()` calls during a refresh never multiplies into multiple requests.
- **Stale-while-revalidate by design.** Expiry *triggers* a reload rather than blocking on one: `get()` hands you the current value immediately and the refresh lands in the background. It deliberately does not try to hand you a value at the exact instant it expires.
- **Monotonic TTL.** Freshness runs on `performance.now()`, so wall-clock jumps (NTP corrections, users changing the system time) cannot expire or revive an entry.
- **Typed derived sub-caches, invalidated by identity.** Declare their names and types once with the `Subs` generic; `derive()` and `getSub()` are then checked against it. A sub-cache re-maps only when the parent value's *reference* changes, and keeps its result otherwise.
- **Failures are never cached.** A rejecting getter leaves the previous value in place and the next `load()` retries. Errors stay in your hands — see [Good to know](#-good-to-know).
- **Sync or async getters, one class.** A sync getter is called inline — `load()` returns the value and expiry recomputes it in place. An async one is awaited in the background, which is what enables stale-while-revalidate. See [Sync and async getters](#sync-and-async-getters).
- **Zero dependencies.** Typed, ESM + CJS.

## 🚀 Usage

### Basics

```ts
import { Cacher } from 'cacher-ts';

const user = new Cacher(async () => {
  const res = await fetch('/api/me');
  return res.json();
}, 60_000);

// The constructor does not fetch. Load explicitly, once, at startup.
await user.load();

user.get(); // → the cached user, synchronously
user.get(); // → same value, no request, no promise
```

`ttl` is required and measured in milliseconds. `Infinity` means "never expires", `0` means "expire immediately" — with an async getter that makes every read start a refresh, with a sync one it recomputes on every read.

### The getter receives the previous value

Every call to the getter — the first one included — is passed the value that is currently cached, so a refresh can build on what it already has:

```ts
const cacher = new Cacher(async (last?: string) => last ?? (await fetchNewestId()), 60_000);

await cacher.load();      // getter receives undefined → fetches "a1"
await cacher.load();      // getter receives "a1"     → returns "a1" as-is
```

The previous value is `undefined` until a first successful load, and it is the *same reference* that `get()` hands out — it is the cache itself, not a copy. Returning it unchanged is a perfectly good refresh: the sub-cache invalidation is identity-based, so an unchanged reference re-maps nothing.

Mutating it in place works too, and is the cheapest way to carry state forward:

```ts
const feed = new Cacher((last: Feed = { items: [], cursor: '' }) => {
  return fetchNewItems(last.cursor).then(({ items, cursor }) => {
    last.items.push(...items); // or build and return a fresh object
    last.cursor = cursor;
    return last;
  });
}, 30_000);
```

Two things to keep in mind. The argument is *only* passed in; nothing merges your return value back into it — the value the getter returns becomes the new cache as-is. And a failed load leaves the previous value untouched, so the next attempt is handed the same starting point again.

The parameter is optional in the getter's type, so a getter that ignores it stays valid; only write it out when you actually use it.

### Reading is sync, refreshing is not

This is the core trade-off. When the entry is past its TTL, `get()` **returns the stale value on that call** and kicks off a refresh — so a burst of callers all read instantly while exactly one request is in flight.

```ts
const config = new Cacher(loadRemoteConfig, 1000);
await config.load(); // fetch #1

config.get();        // → value #1

await sleep(1000);   // ttl elapsed
config.get();        // → value #1 (still), fetch #2 starts in the background
config.get();        // → value #1, no extra request

await config.loading; // wait for the refresh to settle (false when idle)
config.get();        // → value #2
```

When you need a guaranteed-fresh value, join the refresh that `get()` already started — or drive one yourself:

```ts
// 1. Join the in-flight refresh (resolves immediately if none is running):
await config.loading;

// 2. Or fetch outright — `load()` with nothing in flight always fetches:
await config.load();
config.get(); // → the value that fetch produced
```

`loading` is `Promise<T> | false`, which makes it a natural "is a reload running?" probe:

```ts
if (config.loading) showSpinner();
```

### Derived sub-caches

`derive()` registers a named, computed view of a cacher's value. The mapper is called **without `await`**, so it must be a pure synchronous function — that contract is what makes the memoization below sound.

Declare your sub-caches on the type and both the names and their value types are checked for you. `Subs` is a plain map from name to derived type, and it is the **first generic parameter** of `Cacher` — it is the one you write out by hand most often, so it sits first, where a partially applied generic reads naturally:

```ts
import { Cacher } from 'cacher-ts';

interface Config {
  users: { name: string; admin: boolean }[];
}
interface ConfigSubs {
  names: string[];
  adminCount: number;
}

const config = new Cacher<ConfigSubs, typeof loadRemoteConfig>(loadRemoteConfig, 10_000);

config.derive('names', (cfg) => cfg.users.map((u) => u.name));
config.derive('adminCount', (cfg) => cfg.users.filter((u) => u.admin).length);

await config.load();

config.getSub('names');      // → string[]   the mapper runs, the result is remembered
config.getSub('names');      // → string[]   memoized: the source is the same reference
config.getSub('adminCount'); // → number

config.derive('nmaes', (cfg) => cfg.users.length); // ✗ type error: not a key of ConfigSubs
config.getSub('nmaes');                            // ✗ type error
const n: number = config.getSub('names');          // ✗ type error: string[] is not number
```

Both `derive()` and `getSub()` constrain their name to `keyof Subs` and tie the mapper's return type to `Subs[name]`, so a typo or a mismatched mapper is a compile error rather than a runtime surprise. Omitting `Subs` defaults it to `Record<string, any>`, which leaves the names unconstrained and `getSub()` returning `any` — fine for a quick script, but it gives up the checking above.

**Write the getter type out alongside `Subs`.** `Getter` and `T` default to `() => PromiseLike<any>` and `any`, so `new Cacher<ConfigSubs>(...)` alone still checks the sub-cache names but quietly makes `get()` and the mapper parameter `any`. Pass the getter's own type as the second argument — `typeof loadRemoteConfig` if you have a function to point at — and `get()` stays `T`:

```ts
new Cacher<ConfigSubs, typeof loadRemoteConfig>(loadRemoteConfig, 10_000); // get(): Config
new Cacher<ConfigSubs>(loadRemoteConfig, 10_000);                          // get(): any
```

(If you would rather not name the getter's type, supply all three: `new Cacher<ConfigSubs, () => Promise<Config>, Config>(...)`.)

A sub-cache is recomputed when the parent's value changes **by identity** (`Object.is`), and not otherwise:

```ts
await config.load();          // re-fetch returns the same object?  → no re-map
await config.load();          // re-fetch returns a new object?     → re-map
config.getSub('names');       // (also re-maps if the parent cache was empty)
```

So a re-fetch of an equal-but-new object does re-run the mapper, while a re-fetch that yields the same primitive (or the same reference) does not. `getSub()` throws on an unregistered name rather than silently returning `undefined`, so typos fail loudly even at runtime.

```ts
config.removeSub('adminCount'); // → true, drops the derived entry
```

Note that `getSub()` reads the parent's *current* value; it does not itself trigger a reload. Refresh the parent (`get()` / `load()`), then read the derived views.


### Sync and async getters

There is one `Cacher`, and the getter you hand it decides the behavior — no separate class:

```ts
// Sync getter: load() returns the value itself, and get() recomputes in place
// once the ttl has elapsed, so it never observes a stale read.
const env = new Cacher(() => process.env.NODE_ENV ?? 'development', Infinity);

env.load(); // → 'development'
env.get();  // → 'development'

// Async getter: load() returns the thenable, and expiry triggers a background
// refresh that get() reads through on the next call.
const user = new Cacher(async () => (await fetch('/api/me')).json(), 60_000);
```

`load()` mirrors the getter's own type, so a sync getter gives you a plain value back and an async one gives you the promise. Both forms support `derive()`, `getSub()` and `removeSub()`.

## ⚠️ Good to know

- **`Cacher.get()` throws before the first successful `load()`** — there is no value to hand back yet. Load at startup, or guard the first read.
- **`Cacher.get()` can hand you a stale value for one call** — but only with an async getter, where the refresh it triggers runs in the background; join it with `await cacher.loading` or `await cacher.load()` when you need the fresh value. A sync getter recomputes on the spot inside `load()`, so its `get()` is always current.
- **Getter errors are yours to handle.** A failing `load()` rejects, the previously cached value survives, and the next `load()` retries — with the same previous value passed in again, and `cacher.loading` back to `false`. A refresh triggered from `get()` is fire-and-forget, so if your getter can fail and nothing awaits `load()`/`loading`, attach a handler to avoid an unhandled rejection.
- **Mappers must be pure and synchronous.** `getSub()` calls them inline; a throwing mapper propagates, leaving the stored parent/child pair consistent and retryable. Like every other read, they only observe the parent's *current* value.

## License

MIT
