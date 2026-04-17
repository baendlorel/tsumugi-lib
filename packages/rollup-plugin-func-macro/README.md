# rollup-plugin-func-macro

> Using `__func__` and `__file__` like C++ to get current function name and file name (ignores arrow function context) ✨

[![npm version](https://img.shields.io/npm/v/rollup-plugin-func-macro.svg)](https://www.npmjs.com/package/rollup-plugin-func-macro) [![npm downloads](http://img.shields.io/npm/dm/rollup-plugin-func-macro.svg)](https://npmcharts.com/compare/rollup-plugin-func-macro,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/rollup-plugin-func-macro?utm_source=github.com&utm_medium=referral&utm_content=Borewit/rollup-plugin-func-macro&utm_campaign=Badge_Grade)

🎉 **Significant Performance Improvement in v1.2**

- Small files: 8x improvement

- Medium files: 40x improvement

- Large files: 185x improvement

🦋 **More Rollup Plugins** you might be interested in:

- [rollup-plugin-conditional-compilation](https://www.npmjs.com/package/rollup-plugin-conditional-compilation): Use directives like `// #if`, `// #else` to do the conditional compilation like C++.
- [rollup-plugin-const-enum](https://www.npmjs.com/package/rollup-plugin-const-enum): inline your `const enum XXX { ... }` definitions at compile time.
- [rollup-plugin-func-macro](https://www.npmjs.com/package/rollup-plugin-func-macro): replace `__func__` by function name of current block, and `__file__` by file name at compile time.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

> Node version ≥ v14.18.0

## Features ✅

- 🎯 **Dynamic Method Names**: Supports computed property methods like `['dynamicMethod'](){ ... }`
- 🔀 **Variable Embedding**: Replace `__func__` and `__file__` anywhere in expressions and assignments
  - `__func__` provides current function name
  - `__file__` provides current file name
- 📝 **String Replacement**: Automatically replaces identifiers inside string literals and template strings
- 🔧 **Selective Disabling**: Set identifiers to `null` to disable replacements
- 🎯 **TypeScript Support**: After installation, you can add `import 'rollup-plugin-func-macro'` in your global.d.ts file. Then `__func__` and `__file__` will be available in your projects with full type support! ✨
- 🛡️ **Robust Error Handling**: Gracefully handles edge cases and syntax errors

## Installation 📦

```bash
pnpm add -D rollup-plugin-func-macro
```

## Usage 🛠️

### Basic Setup

Options are introduced in comments blow:

```js
// rollup.config.js
import funcMacro from 'rollup-plugin-func-macro';

export default {
  plugins: [
    funcMacro({
      // Function name identifier
      // default: '__func__', set to null to disable
      identifier: '__func__',

      // File name identifier
      // default: '__file__', set to null to disable
      fileIdentifier: '__file__',

      // Files to transform (default)
      include: ['**/*.js', '**/*.ts'],

      // Files to exclude (default)
      exclude: ['node_modules/**'],

      // Fallback when no function found
      // default is equal to identifier
      fallback: identifier,

      // Whether to replace inside string literals
      // default: true
      stringReplace: true,
    }),
  ],
};
```

### Why Ignore Arrow Functions ? 🤷‍♀️

Arrow functions are often anonymous or used as short callbacks. This plugin focuses on meaningful, debuggable function names that you'd actually want to see in logs! (｡◕‿◕｡)

## Examples 💡

### Function Declarations

**Input:**

```js
function myAwesomeFunction() {
  console.log('Current function: __func__');
}
```

**Output:**

```js
function myAwesomeFunction() {
  console.log('Current function:', 'myAwesomeFunction');
}
```

### Class Methods

**Input:**

```js
class Logger {
  logMessage() {
    console.log(`[__func__] Hello world!`);
  }
}
```

**Output:**

```js
class Logger {
  logMessage() {
    console.log(`[logMessage] Hello world!`);
  }
}
```

### Dynamic Method Names 🆕

**Input:**

```js
class ApiHandler {
  ['handleUserRequest']() {
    console.log('Executing:', __func__);
    return `Processing in ${__func__}`;
  }

  ['process' + 'Data']() {
    const methodName = __func__;
    console.log(`Method: ${methodName}`);
  }
}
```

**Output:**

```js
class ApiHandler {
  ['handleUserRequest']() {
    console.log('Executing:', 'handleUserRequest');
    return `Processing in handleUserRequest`;
  }

  ['process' + 'Data']() {
    const methodName = 'processData';
    console.log(`Method: processData`);
  }
}
```

### Variable Embedding in Expressions 🆕

**Input:**

```js
function debugFunction(param) {
  const name = __func__ + '_v2';
  const message = 'Function ' + __func__ + ' called';
  const result = { method: __func__, param };

  if (__func__ === 'debugFunction') {
    console.log(`Confirmed: ${__func__}`);
  }
}
```

**Output:**

```js
function debugFunction(param) {
  const name = 'debugFunction' + '_v2';
  const message = 'Function debugFunction called';
  const result = { method: 'debugFunction', param };

  if ('debugFunction' === 'debugFunction') {
    console.log(`Confirmed: debugFunction`);
  }
}
```

### Edge Cases

Edge cases are also taken good care of! like:

- When using `__func__` inside the dynamic method name: replaced by `[Invalid]` and a warning message is logged to the console.

- nested functions are supported

- complex expressions inside dynamic method names e.g. `['get' + 'Data' + getName()](){ ... }` are handled too. It will replace the identifier with the string literal of the expression(Since evaluating them might be risky for side effects).

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

MIT © [Kasukabe Tsumugi](mailto:futami16237@gmail.com)

---

Made with ❤️
