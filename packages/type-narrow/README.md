# Type Narrow

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Usage

This package provides a single function `narrower` that allows you to narrow the type of a value. It does nothing at runtime, but it allows you to assert that a value is of a certain type.

### function narrow

```ts
import { narrow } from 'type-narrow';

const someValue: unknown = 'hello world';

// Using pure flag to let rollup know that this function can be removed.
/*#__PURE__*/ narrow<string>(someValue);

someValue; // now it's string;
```

_`narrow` also has a alias `static_cast`. It is a tribute to type cast in C++. It does the same thing as `narrow`._

### function createNarrower

```ts
import { createNarrower } from 'type-narrow';

const narrowToString = createNarrower<string>();

// now narrowToString can be reused to narrow to string type.
/*#__PURE__*/ narrowToString(someValue);
```

## License

MIT
