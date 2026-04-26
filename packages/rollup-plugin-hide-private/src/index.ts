import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ExistingRawSourceMap, Plugin } from 'rollup';
import MagicString from 'magic-string';
import ts from 'typescript';

export type Pattern = string | RegExp;
export type HideNameMatcher = boolean | Pattern[];
export type TypeMemberMatcher = false | Pattern[];
export type RollupHidePrivateMode = 'normal' | 'write-files';

export interface RollupHidePrivateOptions {
  /**
   * Plugin operating mode.
   * - `normal`: transform declaration output in the Rollup pipeline.
   * - `write-files`: rewrite matched declaration files on disk in `writeBundle`.
   *
   * @default 'normal'
   */
  mode?: RollupHidePrivateMode;

  /**
   * Glob patterns used to match file paths when `mode` is `write-files`.
   *
   * @default []
   */
  filePatterns?: string[];

  /**
   * Base directory used to resolve `filePatterns` in `write-files` mode.
   *
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Private member names to hide.
   * - Can be `true` to hide all private members, `false` to hide none, or an array of string or RegExp patterns to match member names.
   */
  privateNames?: boolean | Pattern[];

  /**
   * Protected member names to hide.
   * - Can be `true` to hide all protected members, `false` to hide none, or an array of string or RegExp patterns to match member names.
   * @default
   */
  protectedNames?: boolean | Pattern[];

  /**
   * Public member names to hide.
   * - Can be `true` to hide all public members, `false` to hide none, or an array of string or RegExp patterns to match member names.
   *
   * @default false
   */
  publicNames?: boolean | Pattern[];

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

export interface StripHiddenDeclarationsResult {
  code: string;
  map: ExistingRawSourceMap | null;
  removedMembers: string[];
  changed: boolean;
}

type Visibility = 'private' | 'protected' | 'public';

interface NormalizedOptions {
  mode: RollupHidePrivateMode;
  filePatterns: string[];
  cwd: string;
  privateNames: HideNameMatcher;
  protectNames: HideNameMatcher;
  publicNames: HideNameMatcher;
  allNames: Pattern[];
  interfaces: TypeMemberMatcher;
  types: TypeMemberMatcher;
}

interface RemovalRange {
  start: number;
  end: number;
  name: string;
}

const DEFAULT_OPTIONS: NormalizedOptions = {
  mode: 'normal',
  filePatterns: [],
  cwd: process.cwd(),
  privateNames: true,
  protectNames: true,
  publicNames: false,
  allNames: [],
  interfaces: false,
  types: false,
};

/**
 * Hide selected declaration members in TypeScript declaration files.
 *
 * Useful for libraries that want to keep certain members internal while still providing type information for them.
 * When used with `rollup-plugin-dts`, place this plugin before `dts()` in the Rollup plugins array.
 * @param options Options to configure which members to hide.
 *
 * __PKG_INFO__
 */
export default function hidePrivate(options: RollupHidePrivateOptions = {}): Plugin {
  const normalized = normalizeOptions(options);

  return {
    name: 'rollup-plugin-hide-private',
    transform(code, id) {
      if (normalized.mode !== 'normal') {
        return null;
      }

      const fileName = stripQuery(id);
      if (!isDeclarationFile(fileName)) {
        return null;
      }

      return toRollupResult(stripHiddenDeclarationsInternal(code, normalized, fileName));
    },
    renderChunk(code, chunk) {
      if (normalized.mode !== 'normal') {
        return null;
      }

      if (!isDeclarationFile(chunk.fileName)) {
        return null;
      }

      return toRollupResult(stripHiddenDeclarationsInternal(code, normalized, chunk.fileName));
    },
    writeBundle() {
      if (normalized.mode !== 'write-files') {
        return;
      }

      rewriteMatchedDeclarationFiles(normalized);
    },
  };
}

export function stripHiddenDeclarations(
  code: string,
  options: RollupHidePrivateOptions = {},
  fileName = 'index.d.ts',
): StripHiddenDeclarationsResult {
  return stripHiddenDeclarationsInternal(code, normalizeOptions(options), fileName);
}

function stripHiddenDeclarationsInternal(
  code: string,
  options: NormalizedOptions,
  fileName: string,
): StripHiddenDeclarationsResult {
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const removals: RemovalRange[] = [];

  collectHiddenMembers(sourceFile, sourceFile, options, removals);
  if (removals.length === 0) {
    return {
      code,
      map: null,
      removedMembers: [],
      changed: false,
    };
  }

  const MagicStringCtor = MagicString as unknown as typeof import('magic-string').default;
  const magicString = new MagicStringCtor(code, { filename: fileName });
  const merged = mergeRanges(removals);

  for (let i = merged.length - 1; i >= 0; i--) {
    const range = merged[i];
    magicString.remove(range.start, range.end);
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      file: fileName,
      source: fileName,
      includeContent: true,
      hires: true,
    }) as unknown as ExistingRawSourceMap,
    removedMembers: removals.map((item) => item.name),
    changed: true,
  };
}

function collectHiddenMembers(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  options: NormalizedOptions,
  removals: RemovalRange[],
) {
  if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
    collectHiddenClassMembers(node.members, sourceFile, options, removals);
  }

  if (ts.isInterfaceDeclaration(node)) {
    collectHiddenTypeMembers(node.members, sourceFile, options.allNames, options.interfaces, removals);
  }

  if (ts.isTypeLiteralNode(node)) {
    collectHiddenTypeMembers(node.members, sourceFile, options.allNames, options.types, removals);
  }

  ts.forEachChild(node, (child) => collectHiddenMembers(child, sourceFile, options, removals));
}

function collectHiddenClassMembers(
  members: ts.NodeArray<ts.ClassElement>,
  sourceFile: ts.SourceFile,
  options: NormalizedOptions,
  removals: RemovalRange[],
) {
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!isHideableClassMember(member)) {
      continue;
    }

    const visibility = getVisibility(member);
    const matcher =
      visibility === 'private'
        ? options.privateNames
        : visibility === 'protected'
          ? options.protectNames
          : options.publicNames;

    if (!matchesAnyMatcher(member, sourceFile, options.allNames, matcher)) {
      continue;
    }

    removals.push({
      start: member.getFullStart(),
      end: member.getEnd(),
      name: getPrimaryMemberName(member, sourceFile),
    });
  }
}

function collectHiddenTypeMembers(
  members: ts.NodeArray<ts.TypeElement>,
  sourceFile: ts.SourceFile,
  allNames: Pattern[],
  matcher: TypeMemberMatcher,
  removals: RemovalRange[],
) {
  if (allNames.length === 0 && matcher === false) {
    return;
  }

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!isHideableTypeMember(member) || !matchesAnyMatcher(member, sourceFile, allNames, matcher)) {
      continue;
    }

    removals.push({
      start: member.getFullStart(),
      end: member.getEnd(),
      name: getPrimaryMemberName(member, sourceFile),
    });
  }
}

function isHideableClassMember(member: any): member is NamedMember {
  member as ts.ClassElement;
  if (!('name' in member) || !member.name) {
    return false;
  }

  return !ts.isConstructorDeclaration(member);
}

function isHideableTypeMember(member: any): member is NamedMember {
  member as ts.TypeElement;
  return 'name' in member && Boolean(member.name);
}

type NamedMember = {
  name: ts.PropertyName;
  getText(sourceFile?: ts.SourceFile): string;
  getFullStart(): number;
  getEnd(): number;
};

function getVisibility(member: ts.ClassElement & { name: ts.PropertyName }): Visibility | null {
  if (hasModifier(member, ts.SyntaxKind.PrivateKeyword)) {
    return 'private';
  }

  if (hasModifier(member, ts.SyntaxKind.ProtectedKeyword)) {
    return 'protected';
  }

  if ('name' in member && member.name && ts.isPrivateIdentifier(member.name)) {
    return 'private';
  }

  return 'public';
}

function matchesAnyMatcher(
  member: NamedMember,
  sourceFile: ts.SourceFile,
  allNames: Pattern[],
  matcher: HideNameMatcher | TypeMemberMatcher,
): boolean {
  return matchesMemberName(member, sourceFile, allNames) || matchesMemberName(member, sourceFile, matcher);
}

function matchesMemberName(member: NamedMember, sourceFile: ts.SourceFile, matcher: HideNameMatcher): boolean {
  if (matcher === true) {
    return true;
  }

  if (matcher === false) {
    return false;
  }

  const candidates = getMemberNameCandidates(member.name, sourceFile);
  if (candidates.length === 0) {
    return false;
  }

  for (let i = 0; i < matcher.length; i++) {
    const pattern = matcher[i];
    for (let j = 0; j < candidates.length; j++) {
      if (matchesPattern(pattern, candidates[j])) {
        return true;
      }
    }
  }

  return false;
}

function getPrimaryMemberName(member: NamedMember, sourceFile: ts.SourceFile): string {
  const candidates = getMemberNameCandidates(member.name, sourceFile);
  return candidates[0] ?? member.name.getText(sourceFile);
}

function getMemberNameCandidates(name: ts.PropertyName, sourceFile: ts.SourceFile): string[] {
  const candidates = new Set<string>();

  if (ts.isIdentifier(name)) {
    candidates.add(name.text);
  } else if (ts.isPrivateIdentifier(name)) {
    candidates.add(`#${name.text}`);
    candidates.add(name.text);
  } else if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    candidates.add(name.getText(sourceFile));
    candidates.add(name.text);
  } else if (ts.isComputedPropertyName(name)) {
    candidates.add(name.getText(sourceFile));
    if (ts.isIdentifier(name.expression)) {
      candidates.add(name.expression.text);
    }
    if (ts.isStringLiteral(name.expression) || ts.isNumericLiteral(name.expression)) {
      candidates.add(name.expression.getText(sourceFile));
      candidates.add(name.expression.text);
    }
  } else {
    candidates.add(name.getText(sourceFile));
  }

  return [...candidates];
}

function matchesPattern(pattern: string | RegExp, value: string): boolean {
  if (typeof pattern === 'string') {
    return pattern === value;
  }

  pattern.lastIndex = 0;
  return pattern.test(value);
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers = (node as ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
  return Boolean(modifiers?.some((modifier) => modifier.kind === kind));
}

function normalizeOptions(options: RollupHidePrivateOptions): NormalizedOptions {
  const mode = normalizeMode(options.mode);

  return {
    mode,
    filePatterns: normalizeFilePatterns(options.filePatterns, mode),
    cwd: normalizeCwd(options.cwd),
    privateNames: normalizeVisibilityMatcher(options.privateNames, DEFAULT_OPTIONS.privateNames, 'privateNames'),
    protectNames: normalizeVisibilityMatcher(options.protectedNames, DEFAULT_OPTIONS.protectNames, 'protectedNames'),
    publicNames: normalizeVisibilityMatcher(options.publicNames, DEFAULT_OPTIONS.publicNames, 'publicNames'),
    allNames: normalizeAllNames(options.allNames),
    interfaces: normalizeTypeMemberMatcher(options.interfaces, 'interfaces'),
    types: normalizeTypeMemberMatcher(options.types, 'types'),
  };
}

function normalizeMode(mode: RollupHidePrivateOptions['mode']): RollupHidePrivateMode {
  if (mode === undefined) {
    return DEFAULT_OPTIONS.mode;
  }

  if (mode === 'normal' || mode === 'write-files') {
    return mode;
  }

  throw new TypeError('The "mode" option must be either "normal" or "write-files".');
}

function normalizeFilePatterns(
  filePatterns: RollupHidePrivateOptions['filePatterns'],
  mode: RollupHidePrivateMode,
): string[] {
  if (filePatterns === undefined) {
    if (mode === 'write-files') {
      throw new TypeError('The "filePatterns" option is required when mode is "write-files".');
    }

    return [];
  }

  if (!Array.isArray(filePatterns)) {
    throw new TypeError('The "filePatterns" option must be an array of glob strings.');
  }

  const normalized: string[] = [];
  for (let i = 0; i < filePatterns.length; i++) {
    const item = filePatterns[i];
    if (typeof item !== 'string' || item.length === 0) {
      throw new TypeError('The "filePatterns" option must contain only non-empty glob strings.');
    }

    normalized.push(item);
  }

  if (mode === 'write-files' && normalized.length === 0) {
    throw new TypeError('The "filePatterns" option must contain at least one glob when mode is "write-files".');
  }

  return normalized;
}

function normalizeCwd(cwd: RollupHidePrivateOptions['cwd']): string {
  if (cwd === undefined) {
    return DEFAULT_OPTIONS.cwd;
  }

  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('The "cwd" option must be a non-empty string.');
  }

  return cwd;
}

function normalizeVisibilityMatcher(
  matcher: HideNameMatcher | undefined,
  defaultValue: HideNameMatcher,
  optionName: 'privateNames' | 'protectedNames' | 'publicNames',
): HideNameMatcher {
  if (matcher === undefined) {
    return defaultValue;
  }

  if (typeof matcher === 'boolean') {
    return matcher;
  }

  return normalizePatternArray(matcher, optionName);
}

function normalizeAllNames(allNames: RollupHidePrivateOptions['allNames']): Pattern[] {
  if (allNames === undefined) {
    return [];
  }

  return normalizePatternArray(allNames, 'allNames');
}

function normalizeTypeMemberMatcher(
  matcher: RollupHidePrivateOptions['interfaces'] | RollupHidePrivateOptions['types'],
  optionName: 'interfaces' | 'types',
): TypeMemberMatcher {
  if (matcher === undefined || matcher === false) {
    return false;
  }

  return normalizePatternArray(matcher, optionName);
}

function normalizePatternArray(
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

function isDeclarationFile(fileName: string): boolean {
  return fileName.endsWith('.d.ts') || fileName.endsWith('.d.mts') || fileName.endsWith('.d.cts');
}

function rewriteMatchedDeclarationFiles(options: NormalizedOptions) {
  const matchedFiles = globSync(options.filePatterns, {
    cwd: options.cwd,
    withFileTypes: true,
  });

  const uniqueFiles = new Set<string>();
  for (let i = 0; i < matchedFiles.length; i++) {
    const matchedFile = matchedFiles[i];
    if (!matchedFile.isFile()) {
      continue;
    }

    const absolutePath = resolve(options.cwd, matchedFile.parentPath, matchedFile.name);
    if (!isDeclarationFile(absolutePath)) {
      continue;
    }

    uniqueFiles.add(absolutePath);
  }

  for (const filePath of uniqueFiles) {
    const code = readFileSync(filePath, 'utf8');
    const result = stripHiddenDeclarationsInternal(code, options, filePath);
    if (!result.changed) {
      continue;
    }

    writeFileSync(filePath, result.code, 'utf8');
  }
}

function stripQuery(id: string): string {
  const queryIndex = id.indexOf('?');
  const hashIndex = id.indexOf('#');
  const end = [queryIndex, hashIndex].filter((value) => value >= 0).sort((a, b) => a - b)[0];
  return end === undefined ? id : id.slice(0, end);
}

function toRollupResult(result: StripHiddenDeclarationsResult) {
  if (!result.changed || !result.map) {
    return null;
  }

  return {
    code: result.code,
    map: result.map,
  };
}

function mergeRanges(ranges: RemovalRange[]): RemovalRange[] {
  if (ranges.length <= 1) {
    return ranges;
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: RemovalRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];
    if (current.start <= previous.end) {
      previous.end = Math.max(previous.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

export { hidePrivate };
