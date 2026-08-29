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
map.get(['a', 'b']); // undefined — intermediate nodes are internal

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

// forEach
map.forEach((value, keys) => {
  console.log(keys, value);
});

// Clear everything
map.clear();
```

## API

### `new PathMap<K extends any[], V>()`

Creates a new PathMap instance.

### `.get(keys: K): V | undefined`

Returns the value at the given key path, or `undefined` if not found.

### `.set(keys: K, value: V): this`

Sets the value at the given key path. Intermediate Maps are created automatically.

### `.has(keys: K): boolean`

Returns `true` if the given key path exists in the map.

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

Invokes `callbackfn` for each `(value, keys, map)` entry.

### `[Symbol.iterator](): IterableIterator<[K, V]>`

Makes the map iterable. Yields `[keys, value]` tuples.

## License

MIT
