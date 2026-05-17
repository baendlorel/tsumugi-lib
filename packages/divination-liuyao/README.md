# liuyao

Metadata and utility classes for Chinese Liu Yao divination. This package provides typed models for yao lines and hexagrams, along with traditional metadata derived from sources such as Zeng Shan Bu Yi.

For more packages, see [my homepage](https://baendlorel.github.io/?repoType=npm).

## Features

- Create a yao from its yang-count representation.
- Build a hexagram from six yao lines or from a known hexagram name.
- Inspect hexagram metadata such as its name, palace, phase, and setup information.
- Derive the changed hexagram for dynamic lines.
- Access six-god ordering data for different heavenly stems.

## Installation

```bash
pnpm add liuyao
```

## Quick Start

```ts
import { Hexagram, Yao, SixGodList } from 'liuyao';

const hexagram = Hexagram.fromYaos([
	new Yao(3),
	new Yao(1),
	new Yao(2),
	new Yao(2),
	new Yao(1),
	new Yao(0),
]);

if (!hexagram) {
	throw new Error('Invalid hexagram');
}

console.log(hexagram.info.id);
console.log(hexagram.toDescriptionEn());
console.log(hexagram.toChanged()?.info.id);
console.log(SixGodList[0]);
```

## Core Concepts

### Yao

A yao is one line in a hexagram. The constructor accepts a yang count from `0` to `3`:

- `0`: old yin, dynamic
- `1`: young yang, static
- `2`: young yin, static
- `3`: old yang, dynamic

Example:

```ts
import { Yao } from 'liuyao';

const yao = new Yao(3);

console.log(yao.name);
console.log(yao.symbol);
console.log(yao.isDynamic);
```

### Hexagram

A hexagram contains six yao lines ordered from bottom to top.

```ts
import { Hexagram } from 'liuyao';

const qian = Hexagram.fromId('乾为天');

if (qian) {
	console.log(qian.info.sign);
	console.log(qian.info.phase);
	console.log(qian.dynamicInner);
}
```

Useful instance members:

- `info`: metadata for the current hexagram
- `isDynamic`: whether any line is dynamic
- `isChanged`: whether the current hexagram is already a changed hexagram
- `toChanged()`: returns the changed hexagram when dynamic lines exist
- `toDescription()`: Chinese description
- `toDescriptionEn()`: English description

Useful factory methods:

- `Hexagram.fromYaos(yaos)`
- `Hexagram.fromYangCounts(counts)`
- `Hexagram.fromId(id)`
- `Hexagram.fromPalace(palace)`

## Exported API

The package currently exports:

- `Hexagram`
- `Yao`
- `YaoIndex`
- `SixGodList`
- type `SixGod`
- type `SetupGramInfo`

## Notes

- Traditional names and metadata values are kept in Chinese.
- The package focuses on data modeling and lookup. It does not implement a full divination workflow by itself.

## License

MIT
