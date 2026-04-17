# whether-is

[中文说明请见下方](#中文说明)

A comprehensive, extensible, and type-friendly type and value checking utility for JavaScript/TypeScript.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- Rich type and value checking: supports primitives, objects, arrays, classes, special values, and more
- Handles edge cases (cross-realm, etc.)
- TypeScript friendly, with type guards
- Extensible and easy to use

## Installation

```bash
npm install whether-is
```

## Usage

```ts
import { whether } from 'whether-is';

whether.isString('abc'); // true
whether.isNumber(123); // true
whether.isArray([1, 2, 3]); // true
whether.isNullish(undefined); // true
whether.likeDate(new Date()); // true
whether.likePromise(Promise.resolve()); // true

// specially
whether.isNaN(NaN); // true
whether.isNaN(232); // false
whether.isNaN('abc'); // null <- not false!
```

## API Highlights

- `is`, `equal`(deep)
- `isString`, `isNumber`, `isBoolean`, `isNull`, `isUndefined`, `isSymbol`, `isBigInt`
- `isObject`, `likeObject`, `isArray`, `isFunction`, `isClass`, `isArrowFunction`
- `isEmpty`, `isEmptyObject`, `isEmptyArray`, `isNaN`, `isInteger`, `isSafeInteger`, `isSafeNumber`, `isFinite`, `isPrimitive`, `isField`, `isPropertyKey`
- `likeError`, `likeDate`, `likePromise`, `likeSet`, `likeMap`, `likeWeakSet`, `likeWeakMap`, `likeRegExp`
- All `orXXX` methods support optional/undefined values

### Notable Functions

- `isNaN`:
  - Returns `true` only for the real `NaN` value, `false` for numbers, and `null` for non-number types (e.g. `isNaN('abc') === null`). This avoids the pitfalls of the global `isNaN` and is more type-safe.

- `likeXXX` series (e.g. `likeDate`, `likeSet`, `likePromise`):
  - These check if an object is structurally similar to a built-in type, not just by `instanceof`, but by comparing all prototype property types. Useful for cross-realm/iframe and polyfilled objects.
- `isArrowFunction`:
  - Detects arrow functions, even if not a standard function constructor. Handles most edge cases except proxied functions.
  - For precise results, see https://github.com/baendlorel/get-function-features
- `isClass`:
  - Checks if a function is a class constructor, not just a plain function. Uses proxy and string analysis for accuracy.
  - For precise results, see https://github.com/baendlorel/get-function-features
- `isPromiseLike`:
  - Checks if an object is a thenable (Promise A+ spec), not just a native Promise instance.
- `isEmpty`, `isEmptyObject`, `isEmptyArray`:
  - Fine-grained checks for various empty states, including objects with no keys, arrays of length 0, and falsy values.

## Edge Case Handling

- Cross-realm (iframe) objects
- Proxy objects
- Custom class inheritance
- Array-like objects

## License

MIT

---

# 中文说明

一个全面、可扩展、类型友好的 JavaScript/TypeScript 类型和值判定工具库。

## 特性

- 丰富的类型和值判定：支持原始类型、对象、数组、类、特殊值等
- 处理各种边界情况（跨 iframe 等）
- TypeScript 友好，类型守卫
- 可扩展、易用

## 安装

```bash
npm install whether-is
```

## 用法示例

```ts
import { whether } from 'whether-is';

whether.isString('abc'); // true
whether.isNumber(123); // true
whether.isArray([1, 2, 3]); // true
whether.isNullish(undefined); // true
whether.likeDate(new Date()); // true
whether.likePromise(Promise.resolve()); // true

// 特别情况
whether.isNaN(NaN); // true
whether.isNaN(232); // false
whether.isNaN('abc'); // null <- 不是 false!
```

## 主要 API

- `is`, `equal`(deep)
- `isString`, `isNumber`, `isBoolean`, `isNull`, `isUndefined`, `isSymbol`, `isBigInt`
- `isObject`, `likeObject`, `isArray`, `isFunction`, `isClass`, `isArrowFunction`
- `isEmpty`, `isEmptyObject`, `isEmptyArray`, `isNaN`, `isInteger`, `isSafeInteger`, `isSafeNumber`, `isFinite`, `isPrimitive`, `isField`, `isPropertyKey`
- `likeError`, `likeDate`, `likePromise`, `likeSet`, `likeMap`, `likeWeakSet`, `likeWeakMap`, `likeRegExp`
- 所有 `orXXX` 方法支持可选/undefined 判定

### 特色判定函数

- `isNaN`：
  - 只对真正的 `NaN` 返回 `true`，对数字返回 `false`，对非数字类型（如字符串）返回 `null`，避免了全局 `isNaN` 的误判，更加类型安全。

- `likeXXX` 系列（如 `likeDate`, `likeSet`, `likePromise`）：
  - 不仅仅用 `instanceof`，还会比较原型链上所有属性的 typeof，能识别跨 iframe、polyfill 等场景的“类实例”。
- `isArrowFunction`：
  - 检测箭头函数，能区分普通函数和箭头函数（除 proxy 情况外）。
  - 更准确的判定参见：https://github.com/baendlorel/get-function-features
- `isClass`：
  - 判断一个函数是否为 class 构造器，而非普通函数。结合 proxy 和字符串分析，准确率高。
  - 更准确的判定参见：https://github.com/baendlorel/get-function-features
- `isPromiseLike`：
  - 判断对象是否为 Promise-like（thenable，符合 Promise A+ 规范），不仅限于原生 Promise。
- `isEmpty`、`isEmptyObject`、`isEmptyArray`：
  - 细致区分各种“空”状态，包括无键对象、空数组、falsy 值等。

## 边界情况支持

- 跨 iframe（跨全局环境）对象
- Proxy 对象
- 自定义类继承
- 类数组对象

## 许可证

MIT
