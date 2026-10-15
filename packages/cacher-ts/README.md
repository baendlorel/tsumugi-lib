# cacher-ts

[![npm version](https://img.shields.io/npm/v/cacher-ts.svg)](https://www.npmjs.com/package/cacher-ts) [![npm downloads](http://img.shields.io/npm/dm/cacher-ts.svg)](https://npmcharts.com/compare/cacher-ts,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/cacher-ts?utm_source=github.com&utm_medium=referral&utm_content=Borewit/cacher-ts&utm_campaign=Badge_Grade)

A TypeScript TTL cache with async getter support, derived sub-caches, and `@Cache` / `@SubCache` class decorators.

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
- **Failures are never cached.** A throwing or rejected getter leaves the previous value intact; the next call retries.
- **Typed derived sub-caches**, re-mapped only when the parent value changes by identity.
- **`@Cache({ id, ttl? })`** memoizes a zero-argument async method, per instance, with `this` bound automatically.
- **`@SubCache(fromId, subId)`** exposes a derived view of a `@Cache` method as a method of its own.
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
| `ttl`     | `number`                             | `Infinity` | Milliseconds until the cached value expires. `0` = reload on every `get()`. `Infinity` = never expires. Must be a non-negative safe integer or `Infinity`.                                                                     |
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

A sub-cache maps the parent value to a derived shape. The mapper is a **pure synchronous function** called inline; its result is cached until the parent value changes by identity (`Object.is`).

```ts
interface ConfigSubs { names: string[]; adminCount: number }

const config = new Cacher<ConfigSubs, Config>(loadConfig, 10_000);

config.derive('names',      (cfg) => cfg.users.map(u => u.name));
config.derive('adminCount', (cfg) => cfg.users.filter(u => u.admin).length);

await config.reload();
const names = await config.getSub('names');       // string[] — mapper runs, result remembered
const names2 = await config.getSub('names');      // string[] — memoized: parent unchanged

config.hasSub('names');       // boolean
config.deleteSub('names');    // boolean — true if existed and was removed
```

`getSub()` awaits the parent cache (reloads if expired), then runs the mapper only when needed.

Register-and-read in one step:

```ts
const names = await config.getOrDerive('names', (cfg) => cfg.users.map(u => u.name));
```

> **Note:** `getOrDerive` only registers the mapper on the **first** call. Subsequent calls with a different mapper silently reuse the original. Use `deleteSub` + `derive` to replace a mapper.

### Cleanup

```ts
cacher.setThis(newThisArg)  // rebind 'this' for the getter and mappers
cacher.destroy()            // release all references; do not use after this
```

---

## 🎨 Decorators

Requires TypeScript ≥ 5.0 with TC39 stage-3 class decorators. Keep `"experimentalDecorators"` **off** (the default in modern TypeScript).

### `@Cache({ id, ttl? })`

Caches the result of a zero-argument **async** method, separately per instance.

```ts
import { Cache, SubCache, initializeDecoratedCaches } from 'cacher-ts';

class ConfigService {
  @Cache({ id: 'cfg', ttl: 60_000 })
  async loadConfig(): Promise<Config> {
    return fetch('/api/config').then(r => r.json());
  }

  @SubCache('cfg', 'host')
  async host(cfg?: Config): Promise<string> {
    return cfg!.host;
  }
}

const svc = new ConfigService();
await initializeDecoratedCaches();        // eagerly warm all @Cache methods (optional)
const cfg  = await svc.loadConfig();     // cached value
const host = await svc.host();           // derived sub-cache
```

| Option | Type     | Description                                                                                                             |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`   | `string` | Required. Identifies this cache on the instance; used by `@SubCache` to locate the parent. Must be unique per instance. |
| `ttl`  | `number` | Optional. Milliseconds before the value expires. Defaults to `Infinity`.                                                |

Constraints enforced by TypeScript:
- The decorated method must return `Promise<R>` — sync methods fail to compile (`TS1270`).
- The method must have no parameters.

### `@SubCache(fromId, subId)`

Derives a sub-cache from the `@Cache` with the given `id`.

```ts
@SubCache('cfg', 'host')
async host(cfg?: Config): Promise<string> {
  return cfg!.host;
}
```

| Parameter | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `fromId`  | The `id` of a `@Cache` decoration on this class or a parent class. |
| `subId`   | A name for this sub-cache within the parent cacher.                |

Constraints:
- The method must be **async** and its **parameter must be optional** — it is always called with no argument at the call site; the framework passes the parent's cached value in through that parameter.
- The parent `@Cache` must be initialized before calling a `@SubCache` method.

### `initializeDecoratedCaches(force?)`

Eagerly calls `reload()` on every `@Cache` cacher that has not yet loaded. Pass `true` to force-reload all.

```ts
await initializeDecoratedCaches();       // load uninitialised cachers
await initializeDecoratedCaches(true);   // force-reload all
```

Useful at application startup to warm caches before the first request arrives.

### `destroyDecoratedCache(id, instance)`

Destroys the cacher registered for `id` on `instance` and removes it from the internal registry.

```ts
import { destroyDecoratedCache } from 'cacher-ts';

destroyDecoratedCache('cfg', svc);
```

---

## 🧬 Subclass inheritance

| Scenario                                                         | Behaviour                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Child re-declares the method **with `@Cache` and the same `id`** | Throws `Duplicate cache id "…"` at instantiation.                                               |
| Child overrides the method **without `@Cache`**                  | The override is not cached; the parent's initializer is silently skipped for this instance.     |
| Parent has `@Cache`, child adds `@SubCache` referencing it       | Works — the sub-cache finds the parent cacher by instance lookup.                               |
| Parent has `@SubCache`, child adds the matching `@Cache`         | Works — the sub-cache resolves the parent at call time, after the child's cacher is registered. |

---

## 🔷 TypeScript

The `Cacher` class takes two type parameters: `Cacher<Subs, T>`.

```ts
type MySubs = { doubled: number; tag: string };

const cacher = new Cacher<MySubs, number>(async () => 21);
cacher.derive('doubled', v => v * 2);

const n = await cacher.getSub('doubled'); // typed as number
```

> **Tip:** Always provide both type parameters together. TypeScript does not support partial type-argument inference, so writing only `new Cacher<MySubs>(…)` will silently make `T` (and therefore `get()`) return `any`.

---

## License

MIT
