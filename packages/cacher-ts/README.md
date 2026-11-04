# cacher-ts

[![npm version](https://img.shields.io/npm/v/cacher-ts.svg)](https://www.npmjs.com/package/cacher-ts) [![npm downloads](http://img.shields.io/npm/dm/cacher-ts.svg)](https://npmcharts.com/compare/cacher-ts,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/cacher-ts?utm_source=github.com&utm_medium=referral&utm_content=Borewit/cacher-ts&utm_campaign=Badge_Grade)

A TypeScript TTL cache with async getter support and derived sub-caches.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

---

## 📦 Installation

```bash
npm install cacher-ts
# or
pnpm add cacher-ts
```

## ✨ Features

- **Promise-based reads.** `get()` and `reload()` both return `Promise<T>`. Sync getters are transparently wrapped.
- **Lazy load.** The getter is never called until `reload()` (or `get()`) is first invoked.
- **The getter sees the previous value** — `getter(lastValue?: T)`, `undefined` on the first call.
- **One in-flight request per cacher.** Concurrent `reload()` / `get()` calls share one in-flight promise.
- **Monotonic TTL** on `performance.now()` — immune to wall-clock changes.
- **`ttl` accepts `number` or `bigint`** — a `number` must be a non-negative *safe* integer (so `Infinity` and `2147483648` are fine, `2 ** 60` is not); a `bigint` must be non-negative. For TTLs past `2**53` ms, use a `bigint` (`2n ** 60n`). Omitting `ttl` (or passing `Infinity`) means "never expires"; `-1n` is an accepted alias for the same thing.
- **Failures are never cached.** A throwing or rejected getter leaves the previous value intact; the next call retries.
- **Sync `patch()`** to replace the cached value without calling the getter.
- **Typed derived sub-caches**, re-mapped only when the parent value is reloaded or patched.
- Zero runtime dependencies. ESM + CJS dual output.

---

## 🚀 Usage

### Cacher — core class

```ts
import { Cacher } from 'cacher-ts';

const user = new Cacher(async () => (await fetch('/api/me')).json(), 60_000);

await user.reload(); // the constructor does not fetch — load once, at startup
const data = await user.get(); // → the cached user
```

#### Constructor

```ts
new Cacher(getter, ttl?, thisArg?)
```

| Parameter | Type                                 | Default    | Description                                                                                                                                                                                                                    |
| --------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getter`  | `(lastValue?: T) => T \| Promise<T>` | —          | Called on first load and on every TTL expiry. Receives the previous cached value (`undefined` first time). **Handle your own errors** — a thrown or rejected getter leaves the previous value intact and is retried next call. |
| `ttl`     | `number \| bigint`                   | `Infinity` | Milliseconds until the cached value expires. `0` = reload on every `get()`. `Infinity` = never expires. A `number` must be a non-negative safe integer (`2 ** 60` is rejected — it is not a safe integer); a `bigint` must be non-negative (`-1n` is accepted as an alias for `Infinity`). Use `bigint` for TTLs beyond `2**53` ms (~285 000 years). |
| `thisArg` | `any`                                | `null`     | Bound as `this` when calling the getter and sub-cache mappers. Can be changed later with `setThis()`.                                                                                                                          |

#### Reading the value

```ts
// Return the cached value. If not yet initialized or expired, waits for a reload first.
const value = await cacher.get();

// Force a new load. If one is already in flight, join it instead of starting another.
const value = await cacher.reload();
```

#### Properties

```ts
cacher.initialized  // boolean — true after the first successful load
cacher.loading      // Promise<T> | false — the in-flight promise, or false
cacher.destroyed    // boolean — true once destroy() has been called
```

#### Using `setThis`

`setThis(thisArg)` rebinds the receiver for the getter and all sub-cache mappers. Useful inside a class:

```ts
class Api {
  private cacher = new Cacher(this.loadUser, 60_000).setThis(this);

  private async loadUser() {
    return fetch('/api/me').then(r => r.json());
  }
}
```

### Derived sub-caches

A sub-cache maps the parent value to a derived shape. Write the mapper as a **pure synchronous function** — it is called with `thisArg`, and its result is awaited (so an `async` mapper works at runtime, even though the declared type is synchronous) and cached until the parent value is replaced, i.e. after a `reload()` or a `patch()`. An unchanged mapping is reused as long as the parent version does not change.

```ts
interface ConfigSubs { names: string[]; adminCount: number }

const config = new Cacher<ConfigSubs, Config>(loadConfig, 10_000);

config.derive('names',      (cfg) => cfg.users.map(u => u.name));
config.derive('adminCount', (cfg) => cfg.users.filter(u => u.admin).length);

await config.reload();
const names = await config.getSub('names');       // string[] — mapper runs, result remembered
const names2 = await config.getSub('names');      // string[] — memoized: parent version unchanged

config.hasSub('names');       // boolean
config.deleteSub('names');    // boolean — true if existed and was removed
```

`getSub()` awaits the parent cache (reloads if expired), then runs the mapper only when needed.

Register-and-read in one step:

```ts
const names = await config.getOrDerive('names', (cfg) => cfg.users.map(u => u.name));
```

> **Note:** `getOrDerive` only registers the mapper on the **first** call. Subsequent calls with a different mapper silently reuse the original. Use `deleteSub` + `derive` to replace a mapper.

### Updating the value without a reload: `patch`

`patch(mapper)` applies a synchronous function to the cached value and stores the result — no getter call, no await.

```ts
const user = new Cacher(async () => (await fetch('/api/me')).json(), 60_000);
await user.get(); // → { name: 'Ada', visits: 0 }

user.patch(u => ({ ...u, visits: u.visits + 1 })); // → true
const updated = await user.get();                  // → { name: 'Ada', visits: 1 } — no refetch
```

```ts
patch(mapper: (value: T) => T, ignorePending?: boolean): boolean
```

- The mapper receives the **current cached value as-is** (`undefined` before the first load) and its return value becomes the new cached value. It receives no `thisArg` and is not awaited.
- Returns `true` when the patch was applied, `false` when it was skipped.
- `patch` does **not** reset the TTL clock: `get()` may still reload the patched value once the original TTL expires.
- **Race warning:** if a `reload()` is in flight, the patch is skipped and returns `false`, because its result would be overwritten by the load. Pass `ignorePending = true` to force the patch anyway — the in-flight load will still overwrite it when it settles.

```ts
if (!user.patch(u => ({ ...u, visits: u.visits + 1 }))) {
  // a reload is in progress — retry afterwards, or force it:
  user.patch(u => ({ ...u, visits: u.visits + 1 }), true);
}
```

### Cleanup

```ts
cacher.setThis(newThisArg)  // rebind 'this' for the getter and mappers
cacher.destroy()            // release all references; do not use after this
```

`destroy()` is terminal: it clears the value and sub-caches and drops the getter, so the cacher must not be
used afterwards. `cacher.destroyed` reports `true` once it has been called; `initialized` is not reset.

---

## License

MIT
