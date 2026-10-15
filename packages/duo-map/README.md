# duo-map

[![npm version](https://img.shields.io/npm/v/duo-map.svg)](https://www.npmjs.com/package/duo-map) [![npm downloads](http://img.shields.io/npm/dm/duo-map.svg)](https://npmcharts.com/compare/duo-map,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/duo-map?utm_source=github.com&utm_medium=referral&utm_content=Borewit/duo-map&utm_campaign=Badge_Grade)


This package offers 2 containers:

- `DuoMap<K1, K2, V>`: A map with two keys.
- `TresMap<K1, K2, K3, V>`: A map with three keys.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- 🗝️ **Two/three keys, one lookup**: `duo.get(key1, key2)`/`tres.get(key1, key2, key3)` replaces the `map.get(a)?.get(b)`/`map.get(a)?.get(b)?.get(c)` dance.
- 🌲 **Nested semantics**: entries are grouped by `key1`, but the API is flat.
- 🧹 **Self-cleaning**: deleting the last pair of a `key1` group removes the group itself.
- 💤 **Lazy inserts**: `getOrInsertComputed` only computes when the pair is actually missing.
- 🔒 **Type safe**: three independent generic parameters `DuoMap<K1, K2, V>`.
- ⚡ **Lightweight**: no dependencies, zero runtime overhead over plain nested `Map`s.

## Installation / Import

```bash
npm install duo-map
# or
pnpm add duo-map
# or
yarn add duo-map
```

```ts
import { DuoMap } from 'duo-map';
```

## Usage

```ts
import { DuoMap } from 'duo-map';

const map = new DuoMap<string, number, string>();

// set(key1, key2, value) — returns `this`, so calls chain
map.set('users', 1, 'alice');
map.set('users', 2, 'bob').set('posts', 1, 'hello');

// get(key1, key2)
map.get('users', 1); // 'alice'
map.get('users', 2); // 'bob'
map.get('users', 3); // undefined — no such key2
map.get('missing', 1); // undefined — no such key1
```

The same `key2` under a different `key1` is a **different entry**, so namespaces stay independent:

```ts
map.set('users', 1, 'alice');
map.set('posts', 1, 'hello');

map.get('users', 1); // 'alice'
map.get('posts', 1); // 'hello'
map.size; // 2 — not 1
```

### Memoizing with a lazy default

`getOrInsertComputed` runs the factory only when the pair is missing, which makes it a natural fit for memoization:

```ts
type User = { id: number; name: string };
const cache = new DuoMap<string, number, User>();

function getUser(tenant: string, id: number): User {
  return cache.getOrInsertComputed(tenant, id, () => fetchUserFromDb(tenant, id));
}

// Computed once, then served from the cache.
getUser('acme', 1);
getUser('acme', 1);
```

If the factory throws, nothing is written, so the next call retries instead of caching a failure:

```ts
let attempts = 0;
const map = new DuoMap<string, string, number>();

expect(() =>
  map.getOrInsertComputed('a', 'x', () => {
    attempts++;
    throw new Error('db down');
  }),
).toThrow('db down');

map.has('a', 'x'); // false — no half-written entry
```

Use `getOrInsert` when the default value is already on hand and cheap to build:

```ts
const counters = new DuoMap<string, string, number>();

counters.getOrInsert('page', '/home', 0); // 0 — inserted
counters.getOrInsert('page', '/home', 99); // 0 — already there, 99 ignored
```

> Note: the default passed to `getOrInsert` is a plain argument, so it is evaluated on **every** call even when it is not used. If building it is expensive, reach for `getOrInsertComputed`, which defers the factory until the pair is actually missing.

### Inspecting and iterating

```ts
const map = new DuoMap<string, string, number>();
map.set('a', 'x', 1)
   .set('a', 'y', 2)
   .set('b', 'x', 3);

map.size;    // 3 — counts pairs, not key1 groups
map.keys();    // [['a', 'x'], ['a', 'y'], ['b', 'x']]
map.values();  // [1, 2, 3]
map.entries(); // [['a', 'x', 1], ['a', 'y', 2], ['b', 'x', 3]]

map.forEach((value, key1, key2) => {
  console.log(key1, key2, value);
});

for (const [key1, key2, value] of map) {
  console.log(key1, key2, value);
}

map.delete('a', 'x'); // true — 'a' still holds 'y', so the group survives
map.delete('a', 'y'); // true — last pair of 'a' gone, the group is dropped too
map.clear();
```

## API

### `new DuoMap<K1, K2, V>()`

Creates an empty map. All three type parameters default to `any`.

```ts
const loosely = new DuoMap();              // DuoMap<any, any, any>
const typed = new DuoMap<string, number, User>();
```

### `.set(key1: K1, key2: K2, value: V): this`

Stores `value` under the pair, overwriting any previous value. The `key1` group is created on demand. Returns `this` for chaining.

### `.get(key1: K1, key2: K2): V | undefined`

Returns the value stored under the pair, or `undefined` if the pair is absent. A stored `undefined` is indistinguishable from an absent pair here — use `has` when that matters.

### `.getOrInsert(key1: K1, key2: K2, value: V): V`

Returns the existing value if the pair is present, otherwise stores `value` and returns it. Presence is tested with `has`, so an explicitly stored `undefined` is preserved rather than replaced.

### `.getOrInsertComputed(key1: K1, key2: K2, compute: () => V): V`

Like `getOrInsert`, but `compute` is a factory invoked only when the pair is absent. If `compute` throws, the map is left untouched. Mirrors the [upsert proposal](https://github.com/tc39/proposal-upsert) (`Map.prototype.getOrInsertComputed`, Stage 4).

### `.has(key1: K1, key2: K2): boolean`

Returns `true` if the pair exists, including when its value is `undefined`. Does not create the group as a side effect.

### `.delete(key1: K1, key2: K2): boolean`

Removes the pair and reports whether it existed. When that was the group's last pair, the `key1` group is removed as well.

### `.clear(): void`

Removes every entry.

### `.size: number`

The total number of **pairs** across all `key1` groups, computed on each read by summing the group sizes. O(number of `key1` groups), unlike native `Map.size` which is O(1).

### `.forEach(callback: (value: V, key1: K1, key2: K2) => void): void`

Invokes `callback` for each pair. Note the argument order places the value first, and there is no index or collection argument.

### `.keys(): [K1, K2][]`

Returns an array of `[key1, key2]` pairs.

### `.values(): V[]`

Returns an array of all values.

### `.entries(): [K1, K2, V][]`

Returns an array of `[key1, key2, value]` triples.

### `[Symbol.iterator](): Iterator<[K1, K2, V]>`

Yields `[key1, key2, value]` triples, enabling `for...of` and spread.

> `keys()`, `values()`, `entries()` and the iterator all return **snapshots** built from the current state, not live views. Adding entries while iterating will not visit them, and mutating a returned array does not affect the map.

> Ordering follows native `Map`: entries come back grouped by `key1` in insertion order, and within a group by `key2` in insertion order.

### Key equality

Keys are compared with **SameValueZero**, exactly like native `Map` — `NaN` matches `NaN`, `+0` and `-0` are the same key, and object keys match by reference.

## Differences from native `Map`

| Feature               | `Map`               | `DuoMap`                                    |
| --------------------- | ------------------- | ------------------------------------------- |
| Keys per entry        | 1                   | 2                                           |
| Read / write          | `(key)`             | `(key1, key2)`                              |
| Iteration yields      | `[key, value]`      | `[key1, key2, value]`                       |
| `forEach` callback    | `(value, key, map)` | `(value, key1, key2)`                       |
| `keys()` / `values()` | iterators           | plain arrays                                |
| `getOrInsert`         | proposal only       | shipped, with a lazy `getOrInsertComputed`  |
| Empty group cleanup   | —                   | `key1` group dropped with its last `delete` |
| `.size`               | O(1)                | O(number of `key1` groups)                  |

## License

MIT
