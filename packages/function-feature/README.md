# function-feature 🚀

High-performance V8 native function feature detection for Node.js. Supports Node.js 16/18/20/22/24, auto-loads prebuilt binaries, no Nan/N-API dependency required.

> Note: Only works in Node.js environments. And prebuilds are only for linux.

> Recommended: set "type": "module" in your package.json to use this module with ES6 imports.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## 📦 Installation

```bash
npm install function-feature
```

## ✨ Import

```js
import {
  getFeatures,
  getBound,
  getOrigin,
  getProxyConfig,
  setName,
  protoToString,
  isClass,
} from 'function-feature';
```

## 🧩 API Reference

### getFeatures(fn: Function): FunctionFeaturesResult

Analyze a JavaScript function using V8 internals and return its feature flags:

- `isConstructor`: Determines if argument is a function object with a `[[Construct]]` internal method
- `isCallable`: Determines if argument is a callable function with a `[[Call]]` internal method
- `isAsyncFunction`: `true` if the function is an async function
- `isGeneratorFunction`: `true` if the function is a generator function
- `isProxy`: `true` if the function is a Proxy
- `isBound`: `true` if the function has a bound target (created by Function.prototype.bind)
- `isClass`: `true` if the function is a class (either user-defined or native)
- `origin`: The original function/object (unwrapped)

**Example:**

```js
getFeatures(function test(a, b) {});
const result = {
  isConstructor: false,
  isCallable: true,
  isAsyncFunction: false,
  isGeneratorFunction: false,
  isProxy: false,
  isBound: false,
  isClass: false,
  origin: [Function: test]
}
```

### getBound(fn: Function): Function | undefined

Get the original function that satisfies `fn = fn0.bind(thisArg, ...args)`. If not bound, returns itself.

**Example:**

```js
function test() {}
const bound = test.bind(null);
getBound(bound); // returns test
```

### getOrigin(o: Function | object): Function | object

Get the true origin function/object, tracing through bound and proxy wrappers. For objects, only proxy will be unwrapped.

**Example:**

```js
const f0 = function () {};
const proxy = new Proxy(f0, {});
const bound = proxy.bind(null);
getOrigin(bound); // returns f0
getOrigin(proxy); // returns f0
getOrigin({}); // returns {}
```

### getProxyConfig(o: object | Function): { target: unknown, handler: unknown } | undefined

Get proxy details (target and handler) if the input is a Proxy object/function. Returns undefined if not a Proxy.

**Example:**

```js
const target = () => {};
const handler = {};
const proxy = new Proxy(target, handler);
getProxyConfig(proxy); // { target: [Function], handler: {} }
getProxyConfig(target); // undefined
```

### setName(fn: Function, name: string | symbol): Function

Set the name of a function. Only works if the `name` property is configurable. Class/arrow/native functions cannot be changed.

- If `name` is a symbol, uses `name.description`:
  - If `description` is undefined, uses `''`
  - If `description` is a string, uses `'[description]'`

**Example:**

```js
function foo() {}
setName(foo, 'bar');
console.log(foo.name); // 'bar'
setName(foo, Symbol('baz'));
console.log(foo.name); // '[baz]'
```

### protoToString(fn: Function): string

Equivalent to `Function.prototype.toString` but uses V8 internals to get the string representation. Safe and not affected by user overrides.

**Example:**

```js
protoToString(function foo() {});
```

### isClass(fn: Function): boolean

Check if a function is a class (either user-defined or native constructor).

**Rules:**

1. Must be a constructor
2. Gets the original function (unwraps bound functions)
3. Native constructor (Array, Object, etc.) will return `true`
4. Checks function.toString() for class syntax patterns

**Example:**

```js
isClass(Array); // true
isClass(class A {}); // true
isClass(function () {}); // false
```

## 📄 License

MIT
