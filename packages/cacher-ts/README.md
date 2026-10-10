# cacher-ts

[![npm version](https://img.shields.io/npm/v/cacher-ts.svg)](https://www.npmjs.com/package/cacher-ts) [![npm downloads](http://img.shields.io/npm/dm/cacher-ts.svg)](https://npmcharts.com/compare/cacher-ts,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/cacher-ts?utm_source=github.com&utm_medium=referral&utm_content=Borewit/cacher-ts&utm_campaign=Badge_Grade)

A tiny async cache for TypeScript. One in-flight request per cacher, TTL freshness tracked on a monotonic clock, manual `clear()`, and derived sub-caches that only recompute when their source actually changes.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- 🔒 **Single-flight**: concurrent `get()` calls share one pending request, so a cold cache is filled exactly once
- ⏱️ **Monotonic TTL**: freshness is measured with `performance.now()`, so NTP corrections and system clock changes cannot freeze or prematurely expire the cache
- 🛡️ **Failure-safe**: a rejected getter propagates to its callers and never poisons the cache — the next `get()` retries
- 🧹 **`clear()`**: drop the cached value; waits for an in-flight request to settle first
- 🌿 **`derive()`**: build a mapped sub-cacher that recomputes only when the source value changes
- 📦 **Tiny & dependency-free**: no runtime dependencies, ESM + CJS builds with types

## Usage

```bash
npm install cacher-ts
# or
pnpm add cacher-ts
```

### Quick start

```typescript
import { Cacher } from 'cacher-ts';

// The getter is only called when the cache is empty or stale.
const user = new Cacher(() => fetch(`/api/user/${id}`).then((r) => r.json()), 60_000);

const first = await user.get(); // calls the getter
const second = await user.get(); // served from cache (within the 60s TTL)
```

### Concurrent calls share one request

```typescript
const posts = new Cacher(() => fetchPosts(), 0); // 0 => refresh on every call

// Only one request is made; all callers receive the same result.
const [a, b, c] = await Promise.all([posts.get(), posts.get(), posts.get()]);
```

### Refresh on demand

```typescript
await posts.clear(); // drops the cached value; the next get() refetches

const fresh = await posts.get();
```

### Derive a mapped value

```typescript
const user = new Cacher(() => fetchUser(id));

// The mapper runs only when the source value changes.
const displayName = user.derive((u) => u.profile.displayName);

await displayName.get(); // maps the current user
await displayName.get(); // cached, no mapping
```

### API

#### `new Cacher<T>(getter, ttl?)`

| Parameter | Type               | Default      | Description                                          |
| --------- | ------------------ | ------------ | ---------------------------------------------------- |
| `getter`  | `() => Promise<T>` | —            | Produces the value to cache. Must eventually settle. |
| `ttl`     | `number`           | `86_400_000` | Time-to-live in milliseconds (24 hours by default).  |

#### `get(): Promise<T>`

Returns the cached value, refreshing it first when the cache is empty or the TTL has elapsed. When a refresh is already in flight, the pending request is shared instead of starting a new one.

#### `clear(): Promise<void>`

Drops the cached value. If a request is in flight, `clear()` waits for it to settle (success or failure) before clearing, and never rejects itself.

#### `derive<TSub>(pureMapper): SubCacher<TSub>`

Creates a sub-cacher that maps the source value with `pureMapper`. The mapper must be a **pure, synchronous** function; it is called without `await`. The mapped value is cached and recomputed only when the source value changes by identity (`Object.is`).

#### `SubCacher<TSub>.get(): Promise<TSub>`

Returns the mapped value of the parent cacher, remapping when the parent value changes.

### Behaviour & caveats

- **TTL starts when the getter settles**, not when it was called — a slow fetch does not eat into its own freshness window.
- **`ttl: 0`** refreshes on every call; **`ttl: Infinity`** never refreshes.
- **Failures are not cached.** A rejected getter rejects every caller awaiting that request, and the next `get()` retries. There is no backoff, so a persistently failing getter is called once per `get()` — add your own circuit breaker if you need one.
- **A failed refresh propagates the error** rather than serving the previous value.
- **No timeout is applied.** If the getter never settles, every `get()` and `clear()` on that instance waits forever — give the getter its own timeout or abort signal.
- **Values are cached by reference.** The exact object you returned is handed out, so mutations by callers are visible to later readers.
- A failed getter logs a message via `console.error`.

## License

MIT
