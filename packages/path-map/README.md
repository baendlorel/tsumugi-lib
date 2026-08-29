# path-map

A `Map` that uses an array of keys (a **path**) to map to a value. Think of it as a nested `Map` with a flat API.

## Installation

```bash
npm i path-map
```

## Usage

```ts
import { PathMap } from 'path-map';

const map = new PathMap<string[], number>();

// Set values using an array of keys
map.set(['a', 'b', 'c'], 42);

// Get values
map.get(['a', 'b', 'c']); // 42
map.get(['a', 'b']);      // undefined — intermediate nodes are internal

// Check if a path exists
map.has(['a', 'b', 'c']); // true

// Delete a path
map.delete(['a', 'b', 'c']);

// Iteration
map.set(['x', 'y'], 1);
map.set(['x', 'z'], 2);

for (const [keys, value] of map) {
  console.log(keys, value);
}
// ['x', 'y'] 1
// ['x', 'z'] 2

// All entries
map.entries(); // [[['x', 'y'], 1], [['x', 'z'], 2]]
map.keys();    // [['x', 'y'], ['x', 'z']]
map.values();  // [1, 2]

// forEach — third argument is the PathMap instance itself
map.forEach((value, keys, pathMap) => {
  console.log(keys, value, pathMap === map); // true
});

const m = new PathMap<string[], string>();
m.set(['a'], 'hello');

const v1 = m.get(['a']);     // 'hello'
const v2 = m.get(['b']);     // undefined (not found)
const v3 = m.get(['a', 'b']); // undefined (intermediate node, no value stored)

// Clear everything
map.clear();
```

## API

### `new PathMap<K extends any[], V>(entries?)`

Creates a new PathMap instance.

- `entries` — optional `Iterable<[K, V]>` to populate the map on construction.

### `.get(keys: K): V | undefined`

Returns the value at the given key path, or `undefined` if:
- the path does not exist, or
- an intermediate node along the path does not exist.

### `.set(keys: K, value: V): this`

Sets the value at the given key path. Intermediate `Map` nodes are created automatically. If an existing value sits on an intermediate key, it is overwritten by a new `Map` node.

### `.has(keys: K): boolean`

Returns `true` if a value exists at the given key path.

### `.delete(keys: K): void`

Deletes the value at the given key path.

### `.clear(): this`

Removes all entries.

### `.entries(): [K, V][]`

Returns an array of `[keys, value]` pairs.

### `.keys(): K[]`

Returns an array of all key paths.

### `.values(): V[]`

Returns an array of all values.

### `.forEach(callbackfn, thisArg?): this`

Invokes `callbackfn` for each entry. The callback receives:

```ts
(value: V, keys: K, pathMap: PathMap<K, V>) => void
```

The third argument is the `PathMap` instance itself (consistent with `Map.prototype.forEach`).

### `[Symbol.iterator](): IterableIterator<[K, V]>`

Makes the map iterable. Yields `[keys, value]` tuples. Enables `for...of` and spread.

### `[Symbol.toStringTag]`

Returns `'PathMap'`.

## Differences from native `Map`

| Feature            | `Map`          | `PathMap`                               |
| ------------------ | -------------- | --------------------------------------- |
| Key type           | single value   | array of values (a path)                |
| Intermediate nodes | —              | auto-created, hidden                    |
| `forEach` 3rd arg  | `Map` instance | `PathMap` instance                      |
| `.size`            | O(1)           | not provided (O(n) would be misleading) |

## License

MIT
