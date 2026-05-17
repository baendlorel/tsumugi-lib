import path from 'node:path';
import ts from 'typescript';

export interface TsContext {
  checker: ts.TypeChecker;
  program: ts.Program;
  sourceFile: ts.SourceFile;
}

export function createTsContext(fileName: string, code: string): TsContext | null {
  const entryFile = path.resolve(fileName);
  const compilerOptions = loadCompilerOptions(entryFile);
  const compilerHost = createCompilerHost(entryFile, code, compilerOptions);
  const program = ts.createProgram({
    rootNames: [entryFile],
    options: compilerOptions,
    host: compilerHost,
  });
  const sourceFile = program.getSourceFile(entryFile);

  if (!sourceFile) {
    return null;
  }

  return {
    checker: program.getTypeChecker(),
    program,
    sourceFile,
  };
}

function createCompilerHost(entryFile: string, code: string, compilerOptions: ts.CompilerOptions): ts.CompilerHost {
  const host = ts.createCompilerHost(compilerOptions, true);
  const normalizedEntryFile = normalizeFileName(entryFile);
  const originalFileExists = host.fileExists.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.fileExists = (fileName) => {
    if (normalizeFileName(fileName) === normalizedEntryFile) {
      return true;
    }
    return originalFileExists(fileName);
  };

  host.readFile = (fileName) => {
    if (normalizeFileName(fileName) === normalizedEntryFile) {
      return code;
    }
    return originalReadFile(fileName);
  };

  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (normalizeFileName(fileName) === normalizedEntryFile) {
      return ts.createSourceFile(fileName, code, languageVersion, true, getScriptKind(fileName));
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  return host;
}

function loadCompilerOptions(fileName: string): ts.CompilerOptions {
  const configPath = ts.findConfigFile(path.dirname(fileName), ts.sys.fileExists, 'tsconfig.json');
  const defaults = getDefaultCompilerOptions(fileName);

  if (!configPath) {
    return defaults;
  }

  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) {
    return defaults;
  }

  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath), undefined, configPath);

  return {
    ...defaults,
    ...parsed.options,
    noEmit: true,
    declaration: false,
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
    allowNonTsExtensions: true,
  };
}

function getDefaultCompilerOptions(fileName: string): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    jsx: fileName.endsWith('.tsx') ? ts.JsxEmit.Preserve : undefined,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    inlineSources: true,
    noEmit: true,
    sourceMap: true,
    strict: true,
  };
}

function getScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileName.endsWith('.ts')) {
    return ts.ScriptKind.TS;
  }
  if (fileName.endsWith('.mts')) {
    return ts.ScriptKind.TS;
  }
  if (fileName.endsWith('.cts')) {
    return ts.ScriptKind.TS;
  }
  return ts.ScriptKind.Unknown;
}

function normalizeFileName(fileName: string) {
  return path.resolve(fileName);
}
