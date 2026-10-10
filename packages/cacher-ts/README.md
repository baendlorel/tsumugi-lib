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
- **One in-flight request per cacher.** A flood of concurrent `get()` calls during a refresh never multiplies into multiple requests.
- **Stale-while-revalidate by design.** Expiry *triggers* a reload rather than blocking on one: `get()` hands you the current value immediately and the refresh lands in the background. It deliberately does not try to hand you a value at the exact instant it expires.
- **Monotonic TTL.** Freshness runs on `performance.now()`, so wall-clock jumps (NTP corrections, users changing the system time) cannot expire or revive an entry.
- **Derived sub-caches, invalidated by identity.** Register a named view over your value with `derive()`; it re-maps only when the parent value's *reference* changes, and keeps its result otherwise.
- **Failures are never cached.** A rejecting getter leaves the previous value in place and the next `load()` retries. Errors stay in your hands — see [Good to know](#-good-to-know).
- **A sync twin.** `CacherSync` is the same API for getters that are already synchronous, with no promise machinery at all.
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

`ttl` defaults to 24 hours (`86_400_000` ms). `Infinity` means "never expires", `0` means "refresh on every `load()`".

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

`pending` is `Promise<T> | false`, which makes it a natural "is a reload running?" probe:

```ts
if (config.loading) showSpinner();
```

### Derived sub-caches

`derive()` registers a named, computed view of a cacher's value. The mapper is called **without `await`**, so it must be a pure synchronous function — that contract is what makes the memoization below sound.

```ts
const config = new Cacher(loadRemoteConfig, 10_000);

config.derive('names', (cfg) => cfg.users.map((u) => u.name));
config.derive('adminCount', (cfg) => cfg.users.filter((u) => u.admin).length);

await config.load();

config.getSub<string[]>('names'); // mapper runs, result is remembered
config.getSub<string[]>('names'); // memoized — the source is the same reference
```

A sub-cache is recomputed when the parent's value changes **by identity** (`Object.is`), and not otherwise:

```ts
await config.load();             // re-fetch returns the same object?  → no re-map
await config.load();             // re-fetch returns a new object?     → re-map
config.getSub<string[]>('names'); // (also re-maps if the parent cache was empty)
```

So a re-fetch of an equal-but-new object does re-run the mapper, while a re-fetch that yields the same primitive (or the same reference) does not. `getSub()` throws on an unregistered name rather than silently returning `undefined`, so typos fail loudly.

```ts
config.remove('adminCount'); // → true, drops the derived entry
```

Note that `getSub()` reads the parent's *current* value; it does not itself trigger a reload. Refresh the parent (`get()` / `load()`), then read the derived views.

### The synchronous twin

When the getter is already synchronous, `CacherSync` gives you the same surface with no promises involved. It loads eagerly in the constructor and `get()` recomputes in place when the TTL has elapsed.

```ts
import { CacherSync } from 'cacher-ts';

const env = new CacherSync(() => process.env.NODE_ENV ?? 'development', Infinity);

env.get(); // → computed once at construction, then served as-is
env.load(); // → recompute on demand
```

`derive()`, `getSub()` and `remove()` work exactly as above.

## ⚠️ Good to know

- **`Cacher.get()` throws before the first successful `load()`** — there is no value to hand back yet. Load at startup, or guard the first read.
- **`Cacher.get()` can hand you a stale value for one call.** That is the point of the background refresh; await `pending` / `load()` when you need the fresh one. (`CacherSync` has no such window — it recomputes in place.)
- **Getter errors are yours to handle.** A failing `Cacher.load()` rejects, the previously cached value survives, and the next `load()` retries. A refresh triggered from `get()` is fire-and-forget, so if your getter can fail and nothing awaits `pending`, attach a handler to avoid an unhandled rejection. `CacherSync`'s getter throws synchronously instead.
- **Mappers must be pure and synchronous.** `getSub()` calls them inline; a throwing mapper propagates, leaving the stored parent/child pair consistent and retryable.

## License

MIT
