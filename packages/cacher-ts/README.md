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
- **`@Cache(key?, ttl?)`** memoizes a zero-argument method, per instance, with the receiver bound for you.
- **`@SubCache(key)`** exposes a derived view of a cached method as a method of its own.
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

### `setThis`

`setThis()` binds the receiver for a method-style getter, which is then called as `getter.call(thisArg, lastValue)`. It is the only way to bind it, and it matters because an expiry-triggered refresh runs from `get()`, where there is nothing to pass. It returns the cacher, so it chains onto the constructor:

```ts
class Api {
  private cacher = new Cacher(this.loadUser, 60_000).setThis(this);

  private loadUser() { return fetch('/api/me').then((r) => r.json()); }

  get user() {
    return this.cacher.isInitialized ? this.cacher.get() : this.cacher.reload();
  }
}
```

### Reading is sync, refreshing is not

Past the TTL, `get()` returns the current value on that call and starts a refresh in the background, so a burst of callers reads instantly while one request is in flight. The `loading` property is the in-flight promise, or `false` when idle — `await` it to join a refresh, or `await cacher.reload()` to drive one yourself when you need a guaranteed-fresh value.

### Derived sub-caches

`derive()` registers a named, computed view of the cached value. The mapper runs inline, so it must be pure and synchronous; it is called with the cacher's `thisArg`, so `cacher.derive('names', this.extractNames)` works once the cacher is bound with `setThis()`. Declaring the names and types once with the `Subs` generic makes both `derive()` and `getSub()` checked against it:

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

A sub-cache re-maps when the parent changes **by identity** (`Object.is`), so a re-fetch returning a new object re-maps while one returning the same reference does not. `getSub()` throws on an unregistered name and reads the parent's *current* value without triggering a reload; `hasSub(name)` tests whether one is registered, and `deleteSub(name)` drops it.

Pass the getter's type alongside `Subs` — `new Cacher<ConfigSubs>(...)` alone still checks the names but quietly makes `get()` and the mapper parameter `any`.

### Sync and async getters

One class — the getter you hand it decides the behavior. A sync getter recomputes in place when the entry expires, and `reload()` returns its value directly. An async getter is awaited in the background, which is what enables stale-while-revalidate, and `reload()` returns the thenable; either way `reload()` mirrors the getter's own type.

### `@Cache()`

When the thing worth caching is already a method, `@Cache()` wraps it — same cache underneath, and the receiver is bound for you, so the method's own `this` is the instance on every load:

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

Both arguments are optional. `@Cache()` never expires and keys the cache by the method name; `@Cache(ttl)` keeps the method name; `@Cache(key, ttl)` names the key explicitly, which is what `@SubCache` below needs. A lone string is read as the key and a lone number as the ttl.

There is one cache per instance, per key — keyed on the receiver, so instances and sibling methods never share. The method must take no parameters, enforced at class-definition time with a `TypeError`; because the entry is keyed on the instance alone, do not use it on a method whose result depends on other mutable state. A defaulted parameter slips past the check and then receives the previous cached value, exactly as a getter's first argument does:

```ts
@Cache('cfg', 10_000)
async cfg(last?: Config) {
  return last ? patchRemote(last) : (await fetch('/api/config')).json();
}
```

Errors are yours, as everywhere else: a throwing method propagates, nothing is cached, and the next call retries. The decorator uses standard (TC39) decorator semantics, so keep `experimentalDecorators` **off** — the default in modern TypeScript and in tsdown/esbuild.

### `@SubCache()`

`@SubCache(key)` turns a method into a `derive()`d view of the cache behind `@Cache(key)`. The method's single argument is the parent's cached value and its `this` is the instance, so it reads like a normal getter; the result is memoized until the parent value changes by identity.

```ts
import { Cache, SubCache } from 'cacher-ts';

interface ConfigShape {
  users: { name: string; admin: boolean }[];
}

class Config {
  @Cache('cfg', 10_000)
  async cfg(): Promise<ConfigShape> {
    return (await fetch('/api/config')).json();
  }

  @SubCache('cfg')
  adminNames(cfg: ConfigShape) {
    return cfg.users.filter((u) => u.admin).map((u) => u.name);
  }
}

const config = new Config();
await config.cfg();        // creates the cache @SubCache borrows — do this first
await config.adminNames(); // → string[], derived and memoized
```

When the parent is already cached and its getter is synchronous, the derived value comes back directly; otherwise you get a promise for it, so `await` is always safe. The mapper itself must be pure and synchronous, like every other sub-cache mapper.

## ⚠️ Good to know

- **`get()` throws before the first successful `reload()`** — guard the first read with `isInitialized`.
- **`get()` can hand you a stale value for one call** — only with an async getter, where the refresh runs in the background; `await cacher.loading` or `await cacher.reload()` when you need it fresh.
- **Getter errors are yours to handle.** A failing `reload()` rejects, the previous value survives, and the next `reload()` retries. A refresh triggered from `get()` is fire-and-forget, so attach a handler if nothing awaits `reload()`/`loading`.
- **Mappers must be pure and synchronous.** `getSub()` calls them inline; a throwing mapper propagates, leaving the parent/child pair consistent and retryable.
- **`@SubCache()` borrows its parent's cache.** It reaches `@Cache(key)` through a registry written on the instance the first time a cached method runs there, so a `@SubCache()` method throws until its parent has run at least once. On a class with several `@Cache` methods, initialize the parent you intend to derive from first.

## License

MIT
