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
```

`ttl` is required, in milliseconds. `Infinity` never expires; `0` expires immediately, so every read refreshes. `get()` throws until a first load has succeeded — guard it with the `isInitialized` flag, which turns true only after a load has **succeeded**, not merely been attempted.

### The getter receives the previous value

The getter is always called with what is currently cached — `undefined` on the first load. It is the cache itself, not a copy, and it is the same reference `get()` hands out, so mutating it in place is the cheapest way to carry state forward. Nothing merges your return value back in: whatever the getter returns *becomes* the new cache. A failed load leaves the previous value untouched, so the next attempt starts from the same place.

### `defaultValue` and `setThis`

An optional third constructor argument seeds the getter's first argument, exactly like a previous value would — but does *not* count as a load, so `get()` still throws until a real one succeeds.

`setThis()` binds the receiver for a method-style getter, which is then called as `getter.call(thisArg, lastValue)`. It is the only way to bind it, and it matters because an expiry-triggered refresh runs from `get()`, where there is nothing to pass:

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

Past the TTL, `get()` returns the current value on that call and starts a refresh in the background, so a burst of callers reads instantly while one request is in flight. The `loading` property is the in-flight promise, or `false` when idle — `await` it to join a refresh, or `await cacher.reload()` to drive one yourself when you need a guaranteed-fresh value.

### Derived sub-caches

`derive()` registers a named, computed view of the cached value. The mapper runs inline, so it must be pure and synchronous. Declaring the names and types once with the `Subs` generic makes both `derive()` and `getSub()` checked against it:

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
```

A sub-cache re-maps when the parent changes **by identity** (`Object.is`), so a re-fetch returning a new object re-maps while one returning the same reference does not. `getSub()` throws on an unregistered name and reads the parent's *current* value without triggering a reload; `removeSub(name)` drops an entry.

Pass the getter's type alongside `Subs` — `new Cacher<ConfigSubs>(...)` alone still checks the names but quietly makes `get()` and the mapper parameter `any`.

### Sync and async getters

One class — the getter you hand it decides the behavior. A sync getter recomputes in place when the entry expires, and `reload()` returns its value directly. An async getter is awaited in the background, which is what enables stale-while-revalidate, and `reload()` returns the thenable; either way `reload()` mirrors the getter's own type.

### `@Cache()`

When the thing worth caching is already a method, `@Cache(ttl)` wraps it — same cache underneath, receiver bound for you:

```ts
import { Cache } from 'cacher-ts';

class UserStore {
  @Cache(60_000)
  async me() {
    return (await fetch('/api/me')).json();
  }
}

const store = new UserStore();
await store.me(); // → fetches, caches
await store.me(); // → cached
```

There is one cache per instance, per method — keyed on the receiver, so instances and sibling methods never share. The method must take no parameters, enforced at class-definition time with a `TypeError`; because the entry is keyed on the instance alone, do not use it on a method whose result depends on other mutable state. A default parameter slips past the check and is then ignored, and the optional second argument seeds it, like the constructor's third does for a getter.

Errors are yours, as everywhere else: a throwing method propagates, nothing is cached, and the next call retries. The decorator uses standard (TC39) decorator semantics, so keep `experimentalDecorators` **off** — the default in modern TypeScript and in tsdown/esbuild.

## ⚠️ Good to know

- **`get()` throws before the first successful `reload()`** — guard the first read with `isInitialized`. A `defaultValue` does not change this.
- **`get()` can hand you a stale value for one call** — only with an async getter, where the refresh runs in the background; `await cacher.loading` or `await cacher.reload()` when you need it fresh.
- **Getter errors are yours to handle.** A failing `reload()` rejects, the previous value survives, and the next `reload()` retries. A refresh triggered from `get()` is fire-and-forget, so attach a handler if nothing awaits `reload()`/`loading`.
- **Mappers must be pure and synchronous.** `getSub()` calls them inline; a throwing mapper propagates, leaving the parent/child pair consistent and retryable.

## License

MIT
