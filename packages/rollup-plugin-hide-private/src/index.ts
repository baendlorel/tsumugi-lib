import MagicString from 'magic-string';
import type { ExistingRawSourceMap, Plugin } from 'rollup';
import ts from 'typescript';

export type DeclarationNamePattern = string | RegExp;
export type DeclarationNamePatternList = DeclarationNamePattern[];
export type HideNameMatcher = boolean | DeclarationNamePatternList;

export interface RollupHidePrivateOptions {
  privateNames?: HideNameMatcher;
  protectNames?: HideNameMatcher;
  allNames?: DeclarationNamePatternList;
}

export interface StripHiddenDeclarationsResult {
  code: string;
  map: ExistingRawSourceMap | null;
  removedMembers: string[];
  changed: boolean;
}

type Visibility = 'private' | 'protected';

interface NormalizedOptions {
  privateNames: HideNameMatcher;
  protectNames: HideNameMatcher;
  allNames: DeclarationNamePatternList;
}

interface RemovalRange {
  start: number;
  end: number;
  name: string;
}

const DEFAULT_OPTIONS: NormalizedOptions = {
  privateNames: true,
  protectNames: true,
  allNames: [],
};

export default function hidePrivate(options: RollupHidePrivateOptions = {}): Plugin {
  const normalized = normalizeOptions(options);

  return {
    name: 'rollup-plugin-hide-private',
    transform(code, id) {
      const fileName = stripQuery(id);
      if (!isDeclarationFile(fileName)) {
        return null;
      }

      return toRollupResult(stripHiddenDeclarationsInternal(code, normalized, fileName));
    },
    renderChunk(code, chunk) {
      if (!isDeclarationFile(chunk.fileName)) {
        return null;
      }

      return toRollupResult(stripHiddenDeclarationsInternal(code, normalized, chunk.fileName));
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
    for (let i = 0; i < node.members.length; i++) {
      const member = node.members[i];
      if (!isHideableMember(member)) {
        continue;
      }

      const matchesAllNames = matchesMemberName(member, sourceFile, options.allNames);
      const visibility = getVisibility(member);
      if (!matchesAllNames && !visibility) {
        continue;
      }

      if (!matchesAllNames && visibility) {
        const matcher = visibility === 'private' ? options.privateNames : options.protectNames;
        if (!matchesMemberName(member, sourceFile, matcher)) {
          continue;
        }
      }

      removals.push({
        start: member.getFullStart(),
        end: member.getEnd(),
        name: getPrimaryMemberName(member, sourceFile),
      });
    }
  }

  ts.forEachChild(node, (child) => collectHiddenMembers(child, sourceFile, options, removals));
}

function isHideableMember(member: ts.ClassElement): member is ts.ClassElement & { name: ts.PropertyName } {
  if (!('name' in member) || !member.name) {
    return false;
  }

  return !ts.isConstructorDeclaration(member);
}

function getVisibility(member: ts.ClassElement): Visibility | null {
  if (hasModifier(member, ts.SyntaxKind.PrivateKeyword)) {
    return 'private';
  }

  if (hasModifier(member, ts.SyntaxKind.ProtectedKeyword)) {
    return 'protected';
  }

  if ('name' in member && member.name && ts.isPrivateIdentifier(member.name)) {
    return 'private';
  }

  return null;
}

function matchesMemberName(
  member: ts.ClassElement & { name: ts.PropertyName },
  sourceFile: ts.SourceFile,
  matcher: HideNameMatcher,
): boolean {
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

function getPrimaryMemberName(member: ts.ClassElement & { name: ts.PropertyName }, sourceFile: ts.SourceFile): string {
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
  return {
    privateNames: options.privateNames ?? DEFAULT_OPTIONS.privateNames,
    protectNames: options.protectNames ?? DEFAULT_OPTIONS.protectNames,
    allNames: normalizeAllNames(options.allNames),
  };
}

function normalizeAllNames(allNames: RollupHidePrivateOptions['allNames']): DeclarationNamePatternList {
  if (allNames === undefined) {
    return [];
  }

  if (!Array.isArray(allNames)) {
    throw new TypeError('The "allNames" option must be an array of string or RegExp values.');
  }

  const normalized: DeclarationNamePatternList = [];
  for (let i = 0; i < allNames.length; i++) {
    const item = allNames[i];
    if (typeof item !== 'string' && !(item instanceof RegExp)) {
      throw new TypeError('The "allNames" option must contain only string or RegExp values.');
    }
    normalized.push(item);
  }

  return normalized;
}

function isDeclarationFile(fileName: string): boolean {
  return fileName.endsWith('.d.ts') || fileName.endsWith('.d.mts') || fileName.endsWith('.d.cts');
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
