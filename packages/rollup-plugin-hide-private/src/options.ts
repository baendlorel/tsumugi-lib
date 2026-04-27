import type { Matcher, NormalizedOptions, Options, Pattern } from './types.js';
import { DEFAULT_OPTIONS } from './types.js';

export function normalizeOptions(options: Options): NormalizedOptions {
  return {
    privateNames: normalizeVisibilityMatcher(options.privateNames, DEFAULT_OPTIONS.privateNames, 'privateNames'),
    protectedNames: normalizeVisibilityMatcher(
      options.protectedNames,
      DEFAULT_OPTIONS.protectedNames,
      'protectedNames',
    ),
    publicNames: normalizeVisibilityMatcher(options.publicNames, DEFAULT_OPTIONS.publicNames, 'publicNames'),
    allNames: normalizeAllNames(options.allNames),
    interfaces: normalizeTypeMemberMatcher(options.interfaces, 'interfaces'),
    types: normalizeTypeMemberMatcher(options.types, 'types'),
  };
}

export function normalizeVisibilityMatcher(
  matcher: Matcher | undefined,
  defaultValue: Matcher,
  optionName: 'privateNames' | 'protectedNames' | 'publicNames',
): Matcher {
  if (matcher === undefined) {
    return defaultValue;
  }

  if (typeof matcher === 'boolean') {
    return matcher;
  }

  return normalizePatternArray(matcher, optionName);
}

export function normalizeAllNames(allNames: Options['allNames']): Pattern[] {
  if (allNames === undefined) {
    return [];
  }

  return normalizePatternArray(allNames, 'allNames');
}

export function normalizeTypeMemberMatcher(
  matcher: Options['interfaces'] | Options['types'],
  optionName: 'interfaces' | 'types',
): Matcher {
  if (matcher === undefined || matcher === false) {
    return false;
  }

  return normalizePatternArray(matcher, optionName);
}

export function normalizePatternArray(
  patterns: unknown,
  optionName: 'allNames' | 'privateNames' | 'protectedNames' | 'publicNames' | 'interfaces' | 'types',
): Pattern[] {
  if (!Array.isArray(patterns)) {
    throw new TypeError(`The "${optionName}" option must be an array of string or RegExp values.`);
  }

  const normalized: Pattern[] = [];
  for (let i = 0; i < patterns.length; i++) {
    const item = patterns[i];
    if (typeof item !== 'string' && !(item instanceof RegExp)) {
      throw new TypeError(`The "${optionName}" option must contain only string or RegExp values.`);
    }
    normalized.push(item);
  }

  return normalized;
}
