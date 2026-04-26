import MagicString from 'magic-string';
import type { ExistingRawSourceMap } from 'rollup';
import ts from 'typescript';
import { collectImportBindings, getLeftmostIdentifier } from './collect-imports.js';
import { toLiteralText } from './literal.js';
import { shouldInlineEnumName } from './match-inline-name.js';
import type { NormalizedRollupConstEnumOptions } from './types/global.js';

interface InlineTransformOptions {
  checker: ts.TypeChecker;
  filename: string;
  options: NormalizedRollupConstEnumOptions;
  sourceFile: ts.SourceFile;
}

interface Replacement {
  end: number;
  start: number;
  value: string;
}

export interface InlineTransformResult {
  code: string;
  map: ExistingRawSourceMap;
}

export function inlineEnumAccess(
  code: string,
  { checker, filename, options, sourceFile }: InlineTransformOptions,
): InlineTransformResult | null {
  const importedBindings = collectImportBindings(sourceFile);
  const replacements: Replacement[] = [];

  visit(sourceFile);

  if (replacements.length === 0) {
    return null;
  }

  const MagicStringCtor = MagicString as unknown as typeof import('magic-string').default;
  const magicString = new MagicStringCtor(code, { filename });

  for (let i = replacements.length - 1; i >= 0; i--) {
    const replacement = replacements[i];
    magicString.overwrite(replacement.start, replacement.end, replacement.value);
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      file: filename,
      source: filename,
      includeContent: true,
      hires: true,
    }) as unknown as ExistingRawSourceMap,
  };

  function visit(node: ts.Node) {
    if (isSupportedAccessExpression(node)) {
      const replacement = resolveReplacement(node, checker, sourceFile, importedBindings, options);
      if (replacement) {
        replacements.push(replacement);
      }
    }

    ts.forEachChild(node, visit);
  }
}

function resolveReplacement(
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  importedBindings: ReadonlySet<string>,
  options: NormalizedRollupConstEnumOptions,
): Replacement | null {
  const accessSymbol = getAccessSymbol(node, checker);
  if (!accessSymbol) {
    return null;
  }

  const enumMember = getEnumMemberDeclaration(accessSymbol);
  if (!enumMember) {
    return null;
  }

  const enumDeclaration = enumMember.parent;
  if (!ts.isEnumDeclaration(enumDeclaration)) {
    return null;
  }

  if (!isImportedIntoCurrentFile(node, enumDeclaration, sourceFile, importedBindings)) {
    return null;
  }

  const isConstEnum = hasConstModifier(enumDeclaration);
  if (!isConstEnum && !options.inlineNonConstEnums) {
    return null;
  }

  const enumNames = getEnumNameCandidates(enumDeclaration);
  if (!shouldInlineEnumName(enumNames, options.inlineNames)) {
    return null;
  }

  const constantValue = getConstantValue(node, enumMember, checker);
  if (constantValue === undefined) {
    return null;
  }

  return {
    start: node.getStart(sourceFile),
    end: node.getEnd(),
    value: toLiteralText(constantValue, node),
  };
}

function isSupportedAccessExpression(node: ts.Node): node is ts.PropertyAccessExpression | ts.ElementAccessExpression {
  if (ts.isPropertyAccessExpression(node)) {
    return true;
  }

  return (
    ts.isElementAccessExpression(node) && !!node.argumentExpression && ts.isStringLiteralLike(node.argumentExpression)
  );
}

function getAccessSymbol(node: ts.PropertyAccessExpression | ts.ElementAccessExpression, checker: ts.TypeChecker) {
  if (ts.isPropertyAccessExpression(node)) {
    return checker.getSymbolAtLocation(node.name) ?? checker.getSymbolAtLocation(node);
  }

  const argumentExpression = node.argumentExpression;
  if (!argumentExpression || !ts.isStringLiteralLike(argumentExpression)) {
    return undefined;
  }

  const direct = checker.getSymbolAtLocation(argumentExpression);
  if (direct) {
    return direct;
  }

  const expressionType = checker.getTypeAtLocation(node.expression);
  return expressionType.getProperty(argumentExpression.text);
}

function getEnumMemberDeclaration(symbol: ts.Symbol) {
  if (symbol.flags & ts.SymbolFlags.Alias) {
    return undefined;
  }

  if (symbol.valueDeclaration && ts.isEnumMember(symbol.valueDeclaration)) {
    return symbol.valueDeclaration;
  }

  if (!symbol.declarations) {
    return undefined;
  }

  for (let i = 0; i < symbol.declarations.length; i++) {
    const declaration = symbol.declarations[i];
    if (ts.isEnumMember(declaration)) {
      return declaration;
    }
  }

  return undefined;
}

function isImportedIntoCurrentFile(
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  enumDeclaration: ts.EnumDeclaration,
  sourceFile: ts.SourceFile,
  importedBindings: ReadonlySet<string>,
) {
  if (enumDeclaration.getSourceFile() === sourceFile) {
    return true;
  }

  const leftmostIdentifier = getLeftmostIdentifier(node.expression);
  if (!leftmostIdentifier) {
    return false;
  }

  return importedBindings.has(leftmostIdentifier.text);
}

function hasConstModifier(enumDeclaration: ts.EnumDeclaration) {
  if (!enumDeclaration.modifiers) {
    return false;
  }

  for (let i = 0; i < enumDeclaration.modifiers.length; i++) {
    if (enumDeclaration.modifiers[i].kind === ts.SyntaxKind.ConstKeyword) {
      return true;
    }
  }

  return false;
}

function getEnumNameCandidates(enumDeclaration: ts.EnumDeclaration) {
  const names = [enumDeclaration.name.text];
  const qualifiers: string[] = [];
  let current: ts.Node | undefined = enumDeclaration.parent;

  while (current) {
    if (ts.isModuleDeclaration(current)) {
      qualifiers.unshift(current.name.text);
    }
    current = current.parent;
  }

  if (qualifiers.length > 0) {
    names.unshift([...qualifiers, enumDeclaration.name.text].join('.'));
  }

  return names;
}

function getConstantValue(
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  enumMember: ts.EnumMember,
  checker: ts.TypeChecker,
) {
  const direct = checker.getConstantValue(node);
  if (direct !== undefined) {
    return direct;
  }

  return checker.getConstantValue(enumMember);
}
