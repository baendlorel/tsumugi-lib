# duo-map

[![npm version](https://img.shields.io/npm/v/duo-map.svg)](https://www.npmjs.com/package/duo-map) [![npm downloads](http://img.shields.io/npm/dm/duo-map.svg)](https://npmcharts.com/compare/duo-map,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/duo-map?utm_source=github.com&utm_medium=referral&utm_content=Borewit/duo-map&utm_campaign=Badge_Grade)

A tiny cache for TypeScript with a **synchronous read path**: an async getter fills the cache, `get()` reads it without a promise, expiry refreshes in the background, and derived views recompute only when their source changes.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)


## 📦 Installation

```bash
npm install duo-map
# or
pnpm add duo-map
```
## License

MIT
