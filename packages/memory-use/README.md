# memory-use

[![npm version](https://img.shields.io/npm/v/clautcher.svg)](https://www.npmjs.com/package/clautcher) [![npm downloads](http://img.shields.io/npm/dm/clautcher.svg)](https://npmcharts.com/compare/clautcher,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/clautcher?utm_source=github.com&utm_medium=referral&utm_content=Borewit/clautcher&utm_campaign=Badge_Grade)

A cross-platform library for retrieving memory usage information of all processes on the current system. It provides a unified interface to access memory usage data regardless of the underlying operating system.

## Install

```sh
npm i -g memory-use
```

## Usage

```js
import { getMemoryUsage } from 'memory-use'; 

const memoryUsage = getMemoryUsage();
console.log(memoryUsage);
```
Returns an array of objects below

```ts
interface MemoryUsage {
  processName: string;
  pid: number;
  memory: number; // Physical/resident memory in bytes
  /**
   * `null` when not available on this platform. On Windows, this is the "private working set" which matches Task Manager's "内存" column (private resident memory). On other platforms, this may be unavailable or may require elevated permissions, so it's optional.
   */
  privateMemory: number | null;
  /**
   * `null` when not available on this platform. Virtual memory size in bytes. May be unavailable on some platforms or require elevated permissions.
   */
  virtualMemory: number | null; 
}
```


## License
MIT License