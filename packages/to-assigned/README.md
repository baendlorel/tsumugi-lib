# to-assigned

Create a new object, array, function, or special object by copying enumerable properties from one or more source objects. The prototype and type of the result are determined by the first non-primitive source (see below). More flexible than `Object.assign`, supporting arrays, functions, and special objects as the first source.

> Recommended: set "type": "module" in your package.json to use this module with ES6 imports.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- Does not modify the sources.
- Ignores all non-object arguments.
- The result's prototype and type are determined by the first non-primitive source:
  - If all sources are primitive, returns a plain object with `Object.prototype` as its prototype.
  - If the first non-primitive source is:
    - **Array**: result is an array, prototype same as source.
    - **Function**: result is a function with same `name`, `length`, and prototype. (`caller`, `callee`, `arguments` not copied)
    - **Map/Set/WeakMap/WeakSet/Date**: result is a new instance of the same type, initialized from the first source (only own enumerable properties are merged, not collection contents).
    - **Other object**: result is an object with the same prototype as the source.
- Only enumerable properties (including symbol keys) are copied from all sources. Later sources overwrite earlier ones with the same key.

## Installation

```bash
pnpm add to-assigned
# or
npm install to-assigned
# or
yarn add to-assigned
```

## Usage

```ts
import { toAssigned } from 'to-assigned';

// Object prototype inheritance
const proto = { foo: 1 };
const obj = Object.create(proto);
obj.bar = 2;
const result1 = toAssigned(obj, { baz: 3 });
// result1: { bar: 2, baz: 3 }
// Object.getPrototypeOf(result1) === proto

// Array as first source
const arr = [1, 2];
const result2 = toAssigned(arr, { 2: 3, length: 3 });
// result2: [1, 2, 3]
// Object.getPrototypeOf(result2) === Object.getPrototypeOf(arr)

// Function as first source
function fn(a, b) {
  return a + b;
}
fn.extra = 42;
const result3 = toAssigned(fn, { extra: 99 });
// typeof result3 === 'function'
// result3(1,2) === 3
// result3.extra === 99
// Object.getPrototypeOf(result3) === Object.getPrototypeOf(fn)

// Map/Set/WeakMap/WeakSet/Date as first source
const map = new Map([[1, 'a']]);
const result4 = toAssigned(map, { foo: 'bar' });
// result4 instanceof Map
// result4.get(1) === 'a'
// result4.foo === 'bar'

// Non-object as first source
const result5 = toAssigned(123, { a: 1 });
// result5: { a: 1 }
// Object.getPrototypeOf(result5) === Object.prototype
```

## API

### `toAssigned(...sources: any[]): any`

- **sources**: Any number of source objects. Non-object arguments are ignored.
- **Returns**: A new object, array, function, or special object (Map/Set/...) with all enumerable properties from the sources, and prototype/type inherited from the first non-primitive source (see above for rules).

## License

MIT
