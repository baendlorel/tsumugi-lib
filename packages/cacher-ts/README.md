# cacher-ts

[![npm version](https://img.shields.io/npm/v/cacher-ts.svg)](https://www.npmjs.com/package/cacher-ts) [![npm downloads](http://img.shields.io/npm/dm/cacher-ts.svg)](https://npmcharts.com/compare/cacher-ts,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/cacher-ts?utm_source=github.com&utm_medium=referral&utm_content=Borewit/cacher-ts&utm_campaign=Badge_Grade)

A TypeScript TTL cache with async getter support, derived sub-caches, and a `@Cache` class-method decorator.

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
- **`@Cache({ id?, ttl? })`** memoizes a no-argument async method, per instance, with `this` bound automatically. Both options are optional: `id` defaults to the method name.
- **`DecoratedCache` registry helpers** to warm (`initialize`, `initializeAll`), inspect (`get`) and tear down (`destroy`) decorated caches by `id` + instance.
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

A sub-cache maps the parent value to a derived shape. Write the mapper as a **pure synchronous function** — it is called with `thisArg`, and its result is awaited (so an `async` mapper works at runtime, even though the declared type is synchronous) and cached until the parent value changes by identity (`Object.is`).

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

## 🎨 `@Cache`

Requires TypeScript ≥ 5.0 with TC39 stage-3 class decorators. Keep `"experimentalDecorators"` **off** (the default in modern TypeScript).

### Usage

Caches the result of a no-argument **async** method, separately per instance.

```ts
import { Cache, DecoratedCache } from 'cacher-ts';

class ConfigService {
  @Cache({ id: 'cfg', ttl: 60_000 })
  async loadConfig(): Promise<Config> {
    return fetch('/api/config').then(r => r.json());
  }
}

const svc = new ConfigService();
const cfg = await svc.loadConfig();  // getter runs, result cached on `svc`
const again = await svc.loadConfig(); // cached value, getter not called
```

Both options are optional, so the bare form works too:

```ts
class ConfigService {
  @Cache()                    // id defaults to 'loadConfig', ttl to Infinity
  async loadConfig(): Promise<Config> {
    return fetch('/api/config').then(r => r.json());
  }
}
```

| Option | Type     | Default         | Description                                                         |
| ------ | -------- | --------------- | ------------------------------------------------------------------- |
| `id`   | `string` | the method name | Identifies this cache on the instance. Must be unique per instance. |
| `ttl`  | `number` | `Infinity`      | Milliseconds before the value expires. `Infinity` never expires.    |

Sharing an `id` collapses two methods into **one** cache — including across `super` calls — since
`[id, instance]` is the only registry key. Unrelated classes may reuse the same `id`, and each
instance holds its own entry.

Constraints enforced by TypeScript:
- The decorated method must return `Promise<R>` — sync methods fail to compile (`TS1270`).
- The method must have no parameters.

`@Cache` also checks at runtime that it was applied to a method, and throws
`@Cache can only be applied to class methods.` otherwise.

### Registration is lazy

The cacher is created on the **first call** of the decorated method, not when the instance is
constructed. Nothing is registered — no getter runs, no `this` is captured — until you actually
call the method.

```ts
const svc = new ConfigService();  // nothing registered yet
await svc.loadConfig();           // cacher created now, keyed by ['cfg', svc]
```

This matters for the registry helpers below: they only ever see `[id, instance]` pairs that have
been **called at least once**. A freshly constructed instance has nothing registered.

### `DecoratedCache` registry helpers

`DecoratedCache` is a namespace over the module-global registry of every `@Cache` cacher — all
classes, all instances. Each helper takes the same `[id, instance]` key the decorator uses.

```ts
import { DecoratedCache } from 'cacher-ts';

await DecoratedCache.initialize('cfg', svc);  // load this one cacher, if not loaded yet
await DecoratedCache.initializeAll();         // load every cacher that is not initialised
await DecoratedCache.initializeAll(true);     // force-reload every cacher

DecoratedCache.get('cfg', svc);               // Cacher | undefined
DecoratedCache.destroy('cfg', svc);           // tear down and drop the registry entry
```

| Member          | Signature                              | Behaviour                                                                                                                                              |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`    | `(id, instance) => Promise<unknown>`   | Resolves with the cached value, reloading only when the cacher is not initialised yet. **Throws** if `id` is not registered on that instance.          |
| `initializeAll` | `(force?) => Promise<unknown[]>`       | Reloads every registered cacher, and resolves with all of their values. Pass `true` to re-run even initialised getters.                                |
| `get`           | `(id, instance) => Cacher \| undefined` | The underlying [`Cacher`](#cacher--core-class), or `undefined` when nothing is registered.                                                            |
| `destroy`       | `(id, instance) => void`               | Destroys the cacher and removes it from the registry. A no-op if nothing is registered; the next call of the method builds a fresh cacher.            |

> `initializeAll` walks the whole registry, so it warms caches of *any* class and *any* instance —
> there is no per-class or per-instance scoping. Combined with lazy registration, it only ever
> touches methods that have already been called once.

```ts
// Warm everything that has been touched, then drop one cache so it reloads on demand.
await DecoratedCache.initializeAll();
DecoratedCache.destroy('cfg', svc);
```

---

## 🧬 Subclass inheritance

Since a cacher is keyed by `[id, instance]`, what matters is whether the parent and child end up
sharing an `id`.

| Scenario                                                            | Behaviour                                                                                                                                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Child re-declares the method **with `@Cache` and the same `id`**    | Parent and child share one cacher per instance. `super.m()` hits the *same* cache, so the parent's method body never runs.                                                         |
| Child re-declares the method **with `@Cache` and a different `id`** | Two independent cachers. `m()` and `super.m()` (or `m()` on a parent-typed reference) each cache their own result.                                                                 |
| Child overrides the method **without `@Cache`**                     | The override is not cached and the parent's wrapper is shadowed on the prototype, so nothing is warmed for it. Calling `super.m()` still works and caches under the parent's `id`. |
| Child adds a **new** `@Cache` method                                | Independent of the parent's cachers — each `id` is its own entry.                                                                                                                  |

---

## License

MIT
