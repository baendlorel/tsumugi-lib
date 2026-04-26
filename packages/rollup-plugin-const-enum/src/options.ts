import type { NormalizedRollupConstEnumOptions, RollupConstEnumOptions } from './types/global.js';

function assertInlineNames(value: unknown): asserts value is Array<string | RegExp> {
  if (!Array.isArray(value)) {
    throw new TypeError('Expected inlineNames to be Array<string | RegExp>.');
  }

  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (typeof entry === 'string' || entry instanceof RegExp) {
      continue;
    }
    throw new TypeError('Expected inlineNames to be Array<string | RegExp>.');
  }
}

export function normalize(options: Partial<RollupConstEnumOptions> = {}): NormalizedRollupConstEnumOptions {
  const normalized = Object(options) as Partial<RollupConstEnumOptions>;

  if (normalized.inlineNonConstEnums !== undefined && typeof normalized.inlineNonConstEnums !== 'boolean') {
    throw new TypeError('Expected inlineNonConstEnums to be boolean.');
  }

  if (normalized.inlineNames !== undefined) {
    assertInlineNames(normalized.inlineNames);
  }

  return {
    inlineNonConstEnums: normalized.inlineNonConstEnums ?? false,
    inlineNames: normalized.inlineNames,
  };
}
