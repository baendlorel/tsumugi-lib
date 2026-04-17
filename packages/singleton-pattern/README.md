# singleton-pattern

🦄 Wrap your class to make it a true singleton!

> **Note**: Your environment must support ES6 Proxies.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Overview

`singleton-pattern` is a lightweight TypeScript/JavaScript utility that wraps a class constructor so that every `new` call returns the same instance. It uses Proxy to ensure singleton safety, and provides options for prototype and proxy reuse.

## Features

- Make any class a singleton with one line
- Optionally control prototype.constructor behavior
- Optionally reuse proxy for the same class (`options.onlyOnce`)
- Retrieve the original class from a singletonified class
- Fully type-safe

## Installation

```bash
npm install singleton-pattern
# or
pnpm add singleton-pattern
```

## Usage

```typescript
import { singletonify, getSingletonTarget } from 'singleton-pattern';

class Target {
  value: number;
  constructor(v: number) {
    this.value = v;
  }
}

// Basic singleton
const S = singletonify(Target);
const a = new S(1);
const b = new S(2);
console.log(a === b); // true
console.log(a.value); // 1

// Retrieve original class
console.log(getSingletonTarget(S)); // Target

// Option: keep original prototype.constructor
const S2 = singletonify(Target, { changeProtoConstructor: false });
console.log(S2.prototype.constructor === Target); // true

// Option: onlyOnce (reuse proxy for same class)
const S3 = singletonify(Target); // equivalent to (Target, { onlyOnce: true })
const S4 = singletonify(Target); // equivalent to (Target, { onlyOnce: true })
console.log(S3 === S4);

const S5 = singletonify(Target, { onlyOnce: false });
const S6 = singletonify(Target, { onlyOnce: false });
console.log(S5 !== S6);
```

## API

### `singletonify<T extends Class>(target: T, options?: SingletonifyOptions): T`

Wraps a class constructor so that all `new` calls return the same instance.

- `target`: The class to wrap
- `options.changeProtoConstructor` (default: `true`): Boolean. If `true`, sets `prototype.constructor` to the singletonified class. If `false`, keeps the original constructor.
- `options.onlyOnce` (default: `true`): Boolean. If `true`, reuses the same proxy for the same class. If `false`, creates a new proxy each time.

> **Note**: the options object uses Boolean Evaluation(aka. Boolean(x) / if (x))

### `getSingletonTarget<T extends Class>(singleton: T): T | undefined`

Returns the original class for a singletonified class, or `undefined` if not singletonified.

## License

MIT

## Author

Kasukabe Tsumugi <futami16237@gmail.com>
