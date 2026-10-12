# cacher-ts

[![npm version](https://img.shields.io/npm/v/cacher-ts.svg)](https://www.npmjs.com/package/cacher-ts) [![npm downloads](http://img.shields.io/npm/dm/cacher-ts.svg)](https://npmcharts.com/compare/cacher-ts,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/cacher-ts?utm_source=github.com&utm_medium=referral&utm_content=Borewit/cacher-ts&utm_campaign=Badge_Grade)

A tiny cache for TypeScript with a **synchronous read path**: an async getter fills the cache, `get()` reads it without a promise, expiry refreshes in the background, and derived views recompute only when their source changes.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)


## 📦 Installation

```bash
npm install cacher-ts
# or
pnpm add cacher-ts
```

## ✨ Features

- **Sync reads, async fills.** `get()` returns `T`, not `Promise<T>`.
- **No fetch on construction.** Call `reload()` for the first load.
- **The getter sees the previous value** — `getter(lastValue)`, `undefined` on the first load.
- **One in-flight request per cacher.** Concurrent reads never multiply into requests.
- **Stale-while-revalidate.** Expiry *starts* a refresh; `get()` returns the current value at once.
- **Monotonic TTL** on `performance.now()`, so wall-clock jumps cannot expire an entry.
- **Typed derived sub-caches**, re-mapped only when the parent changes by identity.
- **Failures are never cached.** The next `reload()` retries.
- **`@Cache(ttl)`** memoizes a zero-argument method, per instance.
- **Zero dependencies.** Typed, ESM + CJS.

## 🚀 Usage

### Basics

```ts
import { Cacher } from 'cacher-ts';

const user = new Cacher(async () => (await fetch('/api/me')).json(), 60_000);

await user.reload(); // the constructor does not fetch — load once, at startup

user.get();          // → the cached user, synchronously
user.isInitialized;  // → true, once a load has succeeded
```

`ttl` is required, in milliseconds. `Infinity` never expires; `0` expires immediately, so every read refreshes.

### The getter receives the previous value

The getter is always called with what is currently cached — `undefined` on the first load — so a refresh can build on it:

```ts
const cacher = new Cacher(async (last?: string) => last ?? (await fetchNewestId()), 60_000);

await cacher.reload(); // getter receives undefined → fetches "a1"
await cacher.reload(); // getter receives "a1"     → returns it as-is
```

It is the cache itself, not a copy — the same reference `get()` hands out — so mutating it in place is the cheapest way to carry state forward. Nothing merges your return value back in: whatever the getter returns *becomes* the new cache. A failed load leaves the previous value untouched, so the next attempt starts from the same place.

### `isInitialized` and `defaultValue`

`isInitialized` is true only after a load has **succeeded**, which makes it the guard for a first read. The optional third constructor argument seeds the getter's first argument, exactly like a previous value — but does *not* count as a load, so `get()` still throws until a real one succeeds:

```ts
const cacher = new Cacher(async (last?: Config) => last ?? (await fetchConfig()), 10_000, builtInDefaults);

cacher.isInitialized; // → false
cacher.get();         // ✗ throws
await cacher.reload(); // getter receives `builtInDefaults`
cacher.isInitialized; // → true
```

### Passing `this` to the getter

`setThis()` stores the receiver for a method-style getter, called as `getter.call(thisArg, lastValue)`. It is the only way to bind it, and it matters because an expiry-triggered refresh runs from `get()` — where there is nothing to pass:

```ts
class Api {
  private cacher = new Cacher(this.loadUser, 60_000);

  constructor() {
    this.cacher.setThis(this);
  }

  private loadUser() { return fetch('/api/me').then((r) => r.json()); }

  get user() {
    return this.cacher.isInitialized ? this.cacher.get() : this.cacher.reload();
  }
}
```

### Reading is sync, refreshing is not

Past the TTL, `get()` **returns the stale value on that call** and starts a refresh — so a burst of callers reads instantly while one request is in flight:

```ts
await config.reload(); // fetch #1
config.get();          // → value #1

await sleep(1000);     // ttl elapsed
config.get();          // → value #1, fetch #2 starts in the background
await config.loading;  // the in-flight promise, or false when idle
config.get();          // → value #2
```

When you need a guaranteed-fresh value, join the refresh `get()` started with `await config.loading`, or drive one with `await config.reload()`. `loading` doubles as an "is a reload running?" probe.

### Derived sub-caches

`derive()` registers a named, computed view. The mapper runs inline, so it must be pure and synchronous. Declaring the names and types once with the `Subs` generic makes both `derive()` and `getSub()` checked against it:

```ts
interface ConfigSubs {
  names: string[];
  adminCount: number;
}

const config = new Cacher<ConfigSubs, typeof loadRemoteConfig>(loadRemoteConfig, 10_000);

config.derive('names', (cfg) => cfg.users.map((u) => u.name));
config.derive('adminCount', (cfg) => cfg.users.filter((u) => u.admin).length);

await config.reload();
config.getSub('names'); // → string[]   the mapper runs, the result is remembered
config.getSub('names'); // → string[]   memoized: same source reference

config.getSub('nmaes');                   // ✗ type error
const n: number = config.getSub('names'); // ✗ type error: string[] is not number
```

A sub-cache re-maps when the parent changes **by identity** (`Object.is`), so a re-fetch returning a new object re-maps while one returning the same reference does not. `getSub()` throws on an unregistered name and reads the parent's *current* value without triggering a reload; `removeSub(name)` drops an entry.

Pass the getter's type too — `new Cacher<ConfigSubs>(...)` alone still checks the names but quietly makes `get()` and the mapper parameter `any`.

### Sync and async getters

One class — the getter you hand it decides the behavior:

```ts
// Sync: reload() returns the value itself, and expiry recomputes in place.
const env = new Cacher(() => process.env.NODE_ENV ?? 'development', Infinity);

// Async: reload() returns the thenable, and expiry triggers a background
// refresh that get() reads through on the next call.
const user = new Cacher(async () => (await fetch('/api/me')).json(), 60_000);
```

`reload()` mirrors the getter's own type: a plain value for a sync getter, the promise for an async one.

### `@Cache()`

When the thing worth caching is already a method, `@Cache(ttl)` wraps it — same cache underneath, receiver bound for you:

```ts
import { Cache } from 'cacher-ts';

class UserStore {
  private calls = 0;

  @Cache(60_000)
  async me() {
    this.calls++;
    return (await fetch('/api/me')).json();
  }
}

const store = new UserStore();
await store.me(); // → fetches, caches
await store.me(); // → cached, this.calls is still 1
```

**One cache per instance, per method** — keyed on the receiver, so instances and sibling methods never share. **The method must take no parameters**, enforced at class-definition time:

```ts
class Bad {
  @Cache(1000)
  find(id: number) { /* ... */ }
}
// TypeError: @Cache() only decorates a method that takes no parameters, but "find" declares 1.
```

Because the entry is keyed on the instance alone, do not use it on a method whose result depends on other mutable state — a default parameter slips past the check and is then ignored. The optional second argument seeds that default parameter, like the constructor's third does for a getter.

Errors are yours, as everywhere else: a throwing method propagates, nothing is cached, and the next call retries. Awaiting the call is the safe habit — an `async` method returns the promise on the first call and the settled value on later ones.

The decorator uses standard (TC39) decorator semantics, so keep `experimentalDecorators` **off** — the default in modern TypeScript and in tsdown/esbuild.

## ⚠️ Good to know

- **`get()` throws before the first successful `reload()`** — guard the first read with `isInitialized`. A `defaultValue` does not change this.
- **`get()` can hand you a stale value for one call** — only with an async getter, where the refresh runs in the background; `await cacher.loading` or `await cacher.reload()` when you need it fresh.
- **Getter errors are yours to handle.** A failing `reload()` rejects, the previous value survives, and the next `reload()` retries. A refresh triggered from `get()` is fire-and-forget, so attach a handler if nothing awaits `reload()`/`loading`.
- **Mappers must be pure and synchronous.** `getSub()` calls them inline; a throwing mapper propagates, leaving the parent/child pair consistent and retryable.

## License

MIT
