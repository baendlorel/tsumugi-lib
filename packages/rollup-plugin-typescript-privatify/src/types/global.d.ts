import type ts from 'typescript';

export type PrivatifyMode = 'hash' | 'weakmap';

export interface RollupTypescriptPrivatifyOptions {
  /**
   * The mode to use for privatization. Defaults to 'hash'.
   *
   * - `hash`: Real runtime private members of ECMA2022. e.g. `class A{ #x = 1 }`
   * - `weakmap`: Private members are stored in a WeakMap, which provides stronger encapsulation but may have performance implications.
   *    - This mode is more compatible with older JavaScript environments that do not support native private fields.
   */
  mode?: PrivatifyMode;

  /**
   * Remove `private` members from declaration AST via `afterDeclarations` transformer.
   *
   * > Note: this only works when `.d.ts` is emitted by the same TypeScript transformer pipeline.
   * If your build uses an external declaration bundler (for example `rollup-plugin-dts`),
   * this option will not affect that declaration processing.
   */
  hidePrivateDeclarations?: boolean;
}

export interface RollupDtsHidePrivateOptions {
  /**
   * Optional custom matcher to decide whether a declaration file should be transformed.
   */
  include?: (id: string) => boolean;
}

export interface TypescriptPrivatifyTransformers {
  before: ts.TransformerFactory<ts.SourceFile>[];
  afterDeclarations?: ts.TransformerFactory<ts.SourceFile | ts.Bundle>[];
}

export type ClassLikeNode = ts.ClassDeclaration | ts.ClassExpression;

export interface PrivateNameSets {
  instanceNames: Set<string>;
  instanceMethods: Set<string>;
  staticNames: Set<string>;
}

export type CompanionMemberKind = 'property' | 'method' | 'getter' | 'setter';

export interface CompanionMember {
  kind: CompanionMemberKind;
  node: ts.ClassElement;
  name: string;
}
