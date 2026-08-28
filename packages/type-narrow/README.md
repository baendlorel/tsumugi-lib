# static_cast
[![npm version](https://img.shields.io/npm/v/static_cast.svg)](https://www.npmjs.com/package/static_cast) [![npm downloads](http://img.shields.io/npm/dm/static_cast.svg)](https://npmcharts.com/compare/static_cast,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/static_cast?utm_source=github.com&utm_medium=referral&utm_content=Borewit/static_cast&utm_campaign=Badge_Grade)

Function `static_cast` that allows you to narrow the type of a value. It does nothing at runtime.


For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

> `static_cast` is a tribute to C++.

## Usage

### When you need it ?

Some times we use custom methods to identify the correct type of some value.

```ts
// element is some kind of input element.
if (element.tagName === 'INPUT'){
  static_cast<HTMLInputElement>(element);
  element.value = xxx; // now use element as a HTMLInputElement
} else if (element.tagName === 'SELECT'){
  static_cast<HTMLSelectElement>(element);
  element.value = xxx;
}
```

### Tree Shaking

Since `"sideEffects": false`, these `static_cast` calls can be safely removed during tree shaking.

## License

MIT
