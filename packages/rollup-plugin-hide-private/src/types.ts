import { ExistingRawSourceMap } from 'rollup';

export type Pattern = string | RegExp;
export type Matcher = boolean | Pattern[];

export interface Options {
  /**
   * Private member names to hide.
   * - Can be `true` to hide all private members, `false` to hide none, or an array of string or RegExp patterns to match member names.
   */
  privateNames?: Matcher;

  /**
   * Protected member names to hide.
   * - Can be `true` to hide all protected members, `false` to hide none, or an array of string or RegExp patterns to match member names.
   * @default
   */
  protectedNames?: Matcher;

  /**
   * Public member names to hide.
   * - Can be `true` to hide all public members, `false` to hide none, or an array of string or RegExp patterns to match member names.
   *
   * @default false
   */
  publicNames?: Matcher;

  /**
   * Interface member names to hide.
   * - Can be `false` to hide none, or an array of string or RegExp patterns to match member names.
   *
   * @default false
   */
  interfaces?: false | Pattern[];

  /**
   * Type literal member names to hide.
   * - Can be `false` to hide none, or an array of string or RegExp patterns to match member names.
   *
   * @default false
   */
  types?: false | Pattern[];

  /**
   * Any member names to hide, regardless of visibility.
   * - Can be an array of string or RegExp patterns to match member names.
   *
   * @default undefined
   */
  allNames?: Pattern[];
}

export interface Result {
  code: string;
  map: ExistingRawSourceMap | null;
  removedMembers: string[];
  changed: boolean;
}

export type Visibility = 'private' | 'protected' | 'public';

export interface NormalizedOptions {
  privateNames: Matcher;
  protectedNames: Matcher;
  publicNames: Matcher;
  allNames: Pattern[];
  interfaces: Matcher;
  types: Matcher;
}

export interface RemovalRange {
  start: number;
  end: number;
  name: string;
}

export const DEFAULT_OPTIONS: NormalizedOptions = {
  privateNames: true,
  protectedNames: true,
  publicNames: false,
  allNames: [],
  interfaces: false,
  types: false,
};
