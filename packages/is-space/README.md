# is-space

[![npm version](https://img.shields.io/npm/v/is-space.svg)](https://www.npmjs.com/package/is-space) [![npm downloads](http://img.shields.io/npm/dm/is-space.svg)](https://npmcharts.com/compare/is-space,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/is-space?utm_source=github.com&utm_medium=referral&utm_content=Borewit/is-space&utm_campaign=Badge_Grade)

After waking up from my nap, I came up with an approach to determine whitespace characters that is absolutely compliant with ECMA-262. Now I've packaged it up for everyone to use.

This package exports only one function: `isSpace`. Use it to check whether a character or string consists solely of whitespace characters — without worrying about whether you've written the complete regular expression.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Features

**`isSpace`**: Checks if a string contains only space characters via JavaScript's standard (ECMA-262).

## Usage

```ts
import { isSpace } from 'is-space';

// Check single characters
isSpace(' ')      // true  (regular space)
isSpace('\t')     // true  (tab)
isSpace('\n')     // true  (newline)
isSpace('\r')     // true  (carriage return)
isSpace('a')      // false (regular character)
isSpace('5')      // false (number)
isSpace('')       // true (empty string)

// Check other whitespace characters
isSpace('\f')     // true  (form feed)
isSpace('\v')     // true  (vertical tab)
isSpace(' ') // true  (non-breaking space)
isSpace('') // true  (line separator)
isSpace('') // true  (paragraph separator)

// Works with any character
isSpace('🚀')     // false (emoji)
isSpace('中')     // false (Chinese character)
```

## License

MIT
