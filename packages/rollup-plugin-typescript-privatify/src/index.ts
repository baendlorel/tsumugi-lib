import { createPrivatifyTransformer } from './core/transformer.js';
import { createHidePrivateDeclarationsTransformer } from './core/declaration.js';
import { hidePrivateDeclarationsForDts } from './dts-plugin.js';
import type {
  PrivatifyMode,
  RollupDtsHidePrivateOptions,
  RollupTypescriptPrivatifyOptions,
  TypescriptPrivatifyTransformers,
} from './types/global.js';

export type {
  PrivatifyMode,
  RollupDtsHidePrivateOptions,
  RollupTypescriptPrivatifyOptions,
  TypescriptPrivatifyTransformers,
};
export { privatify, createPrivatifyTransformer, hidePrivateDeclarationsForDts };

const ROLLUP_GUARD_KEYS = [
  'name',
  'options',
  'buildStart',
  'resolveId',
  'load',
  'transform',
  'renderStart',
  'renderChunk',
  'generateBundle',
  'writeBundle',
] as const;

const ROLLUP_USAGE_ERROR =
  'This package is not a direct Rollup plugin. Use it in @rollup/plugin-typescript, e.g. typescript({ transformers: typescriptPrivatify() }).';

export default function privatify(options: RollupTypescriptPrivatifyOptions = {}): TypescriptPrivatifyTransformers {
  const transformers: TypescriptPrivatifyTransformers = {
    before: [createPrivatifyTransformer(options)],
  };

  if (options.hidePrivateDeclarations === true) {
    transformers.afterDeclarations = [createHidePrivateDeclarationsTransformer()];
  }

  applyRollupGuards(transformers);
  return transformers;
}

function applyRollupGuards(target: TypescriptPrivatifyTransformers) {
  const throwUsageError = () => {
    throw new Error(ROLLUP_USAGE_ERROR);
  };

  for (let i = 0; i < ROLLUP_GUARD_KEYS.length; i++) {
    const key = ROLLUP_GUARD_KEYS[i];
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      continue;
    }

    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      get: throwUsageError,
    });
  }
}
