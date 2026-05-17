export interface RollupConstEnumOptions {
  /**
   * Inline regular `enum` members in addition to `const enum`.
   * - default: `false`
   */
  inlineNonConstEnums: boolean;

  /**
   * Only inline enums whose declaration names match one of these rules.
   * - default: `undefined`
   */
  inlineNames?: Array<string | RegExp>;
}

export interface NormalizedRollupConstEnumOptions {
  inlineNonConstEnums: boolean;
  inlineNames?: Array<string | RegExp>;
}
