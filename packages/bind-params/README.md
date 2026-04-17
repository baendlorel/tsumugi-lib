# bind-params ⚙️

A tiny utility to create functions with bound leading arguments while preserving runtime properties and providing complete TypeScript type hints.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

- **Fix Arguments**: Creates a new function with leading arguments bound (like Function.prototype.bind but only for leading params).
- **Consistency**: Preserves `length`. And `this` context.
- **Trival Case**: If 0 argument are bound, the original function is returned unchanged.
- **Full type hints**: the library is designed for excellent TypeScript ergonomics.

> Note: the implementation limits the maximum number of tracked bound parameters to 16 by default (this is a practical limit to keep types tractable). You can adjust this in the declaration file(`index.d.ts`) if you need more.

## Usage

```ts
import { bindParams } from 'bind-params';

function original(a: number, b: string, c: boolean): void {}

// newFn will have the type:
const newFn: (c: boolean) => void = bindParams(original, 42, 'hello');
```

## API

### bindParams(fn, ...bound)

- `fn`: function — the function whose leading arguments will be bound
- `...bound`: values — the leading arguments to bind
- Returns: a new function that calls the original with bound leading arguments and then the provided arguments

Behavior details:

- Preserves `length`.
- Preserves `this` semantics (calls original with `.call`).
- Returns the original function if 0 argument are bound.

## License

MIT
