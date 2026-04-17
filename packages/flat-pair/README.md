# flat-pair

[![npm version](https://img.shields.io/npm/v/flat-pair.svg)](https://www.npmjs.com/package/flat-pair) [![npm downloads](http://img.shields.io/npm/dm/flat-pair.svg)](https://npmcharts.com/compare/flat-pair,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/flat-pair?utm_source=github.com&utm_medium=referral&utm_content=Borewit/flat-pair&utm_campaign=Badge_Grade)

A lightweight TypeScript library for storing key-value pairs using arrays. Provides serializable storage with efficient value-based lookups and zero-cost static methods.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- 🔍 **Bidirectional Search**: Find keys by values and values by keys
- 📦 **Serializable**: Easy JSON serialization/deserialization
- 🛡️ **Type Safe**: Full TypeScript support with generic types
- 🎯 **Zero Cost**: Static methods available for minimal overhead
- ⚡ **Lightweight**: No dependencies, minimal bundle size
- 🌲 **Native Behavior**: `forEach`, `find` acts like they are in `Array`. Equality check uses `SameValueZero`

## Installation / Import

```bash
npm install flat-pair
# or
pnpm install flat-pair
```

```typescript
import { FlatPair, FlatPairOperator, add, get, find ...others } from 'flat-pair';
```

## Quick Start

### FlatPair Class

`FlatPair` is a container class has an `items` array, it has methods that wrap the static functions for easier usage.

```typescript
// userId - detail pair
const pairs = new FlatPair<number, Detail>();
pairs.add(1, { name: 'Alice', age: 30 }); // won't change value when key exists
pairs.set(2, { name: 'Bob', age: 25 });
pairs.remove(1);
pairs.find((value, key) => value.age > 20);
```

### Using Static Functions (Zero Cost)

```typescript
const items: any[] = [];

// Add items
add<string, string>(items, 'name', 'John');
add<string, number>(items, 'age', 12);

// Remove and other operations
remove(items, 'age'); // returns true
console.log(size(items)); // 1
clear(items); // empties the array
```

### Using FlatPairOperator Class (For fixed type hint)

If you don't want to specify the generic types every time you call a static function, you can use `FlatPairOperator` which wraps the static functions with fixed generic types.

```typescript
import { FlatPairOperator } from 'flat-pair';

const operator = new FlatPairOperator<string, number>();
const items: any[] = [];

operator.add(items, 'score', 100); // operator's add method is always typed
operator.add(items, 'level', 5);

console.log(operator.get(items, 'score')); // 100
console.log(operator.getByValue(items, 5)); // 'level'
```

## Performance

FlatPair uses a simple array structure `[key1, value1, key2, value2, ...]` which provides:

- **Memory Efficiency**: No object overhead per pair
- **Serialization**: Direct JSON support
- **Cache Friendly**: Contiguous memory layout
- **Predictable**: O(n) operations with low constant factors

> Note: For large datasets, consider using a Map or Object for O(1) lookups instead of this package.

## License

MIT © Kasukabe Tsumugi
