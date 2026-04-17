export interface FuncMacroOptions {
  /**
   * The identifier to replace with function name
   * - defaults to '__func__'
   * - set to `null` to disable function name replacement
   */
  identifier: '__func__' | '__FUNCTION__' | (string & {}) | null;

  /**
   * The identifier to replace with file name
   * - defaults to '__file__'
   * - set to `null` to disable file name replacement
   */
  fileIdentifier: '__file__' | '__filename__' | '__FILE__' | (string & {}) | null;

  /**
   * Fallback value when function name cannot be found
   * - defaults to `identifier`
   */
  fallback: string;

  /**
   * Files to include, defaults to `[✳️✳️/✳️.js, ✳️✳️/✳️.ts]`
   */
  include: string | string[];

  /**
   * Files to exclude, defaults to `[node_modules/✳️✳️]`
   */
  exclude: string | string[];

  /**
   * Whether to replace identifiers inside string literals
   * - defaults to `true`
   */
  stringReplace: boolean;
}
