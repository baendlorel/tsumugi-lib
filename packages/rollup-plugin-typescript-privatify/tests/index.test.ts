import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import privatify, { hidePrivateDeclarationsForDts } from '../src/index.js';

function transpile(input: string, mode: 'hash' | 'weakmap' = 'hash') {
  return ts.transpileModule(input, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    transformers: privatify({ mode }),
  }).outputText;
}

function compact(code: string) {
  return code.replace(/\s+/g, '');
}

function resolveHookHandler<T extends Function>(hook: unknown): T | undefined {
  if (typeof hook === 'function') {
    return hook as T;
  }

  if (hook && typeof hook === 'object' && 'handler' in hook) {
    const handler = (hook as { handler?: unknown }).handler;
    if (typeof handler === 'function') {
      return handler as T;
    }
  }

  return undefined;
}

function emitDts(input: string, hidePrivateDeclarations = false) {
  const fileName = '/entry.ts';
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    declaration: true,
    emitDeclarationOnly: true,
    skipLibCheck: true,
  };

  const defaultHost = ts.createCompilerHost(options);
  const host: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile) {
      if (name === fileName) {
        return ts.createSourceFile(name, input, languageVersion, true, ts.ScriptKind.TS);
      }
      return defaultHost.getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
    },
    readFile(name) {
      if (name === fileName) {
        return input;
      }
      return defaultHost.readFile(name);
    },
    fileExists(name) {
      if (name === fileName) {
        return true;
      }
      return defaultHost.fileExists(name);
    },
  };

  let dts = '';
  const writeFile: ts.WriteFileCallback = (name, text) => {
    if (name.endsWith('.d.ts')) {
      dts = text;
    }
  };

  const program = ts.createProgram([fileName], options, host);
  program.emit(undefined, writeFile, undefined, true, privatify({ hidePrivateDeclarations }));

  return dts;
}

describe('rollup-plugin-typescript-privatify', () => {
  it('returns before transformers for @rollup/plugin-typescript', () => {
    const config = privatify();
    expect(config.before).toHaveLength(1);
    expect(typeof config.before[0]).toBe('function');
  });

  it('registers declaration transformer when hidePrivateDeclarations is enabled', () => {
    const config = privatify({ hidePrivateDeclarations: true });
    expect(config.afterDeclarations).toHaveLength(1);
  });

  it('throws helpful error when misused as direct Rollup plugin', () => {
    const config = privatify() as unknown as Record<string, unknown>;
    expect(() => config.name).toThrowError(
      /not a direct Rollup plugin.*typescript\(\{ transformers: typescriptPrivatify\(\) \}\)/i,
    );
    expect(Object.keys(config)).toEqual(['before']);
  });

  it('can strip private declarations in rollup-plugin-dts output stage', () => {
    const plugin = hidePrivateDeclarationsForDts();
    const code = `
      export declare class A {
        private a;
        #private;
        p: number;
      }
    `;

    const renderChunk = resolveHookHandler<(code: string, chunk: { fileName: string }, options: unknown) => unknown>(
      plugin.renderChunk,
    );
    const result = renderChunk?.(code, { fileName: 'index.d.ts' }, {});
    const nextCode = typeof result === 'string' ? result : ((result as { code?: string } | null)?.code ?? '');
    const compacted = compact(nextCode);
    expect(compacted).not.toContain('privatea');
    expect(compacted).not.toContain('#private');
    expect(compacted).toContain('p:number;');
  });

  it('can strip private declarations in transform stage for declaration files', () => {
    const plugin = hidePrivateDeclarationsForDts();
    const code = 'export declare class A { private x; y: string; }';
    const transform = resolveHookHandler<(code: string, id: string) => unknown>(plugin.transform);
    const result = transform?.(code, '/tmp/input.d.ts');
    const nextCode = typeof result === 'string' ? result : ((result as { code?: string } | null)?.code ?? '');
    const compacted = compact(nextCode);
    expect(compacted).not.toContain('privatex');
    expect(compacted).toContain('y:string;');
  });

  it('converts private members to ECMAScript hash private fields in hash mode', () => {
    const source = `
      class A {
        private count = 1;
        private static version = 0;

        private inc(step: number) {
          this.count += step;
          return this.count;
        }

        static nextVersion() {
          this.version += 1;
          return this.version;
        }

        public run() {
          return this.inc(2);
        }
      }
    `;

    const output = compact(transpile(source, 'hash'));
    expect(output).toContain('#count=1;');
    expect(output).toContain('static#version=0;');
    expect(output).toContain('#inc(step){');
    expect(output).toContain('this.#count+=step;');
    expect(output).toContain('this.#version+=1;');
    expect(output).toContain('returnthis.#inc(2);');
  });

  it('extracts instance private members into companion class in weakmap mode', () => {
    const source = `
      class A {
        private value = 1;

        private bump(delta: number) {
          this.value += delta;
          return this.value;
        }

        read(n: number) {
          return this.bump(n) + this.value;
        }
      }
    `;

    const output = compact(transpile(source, 'weakmap'));
    expect(output).toContain('classA__private{');
    expect(output).toContain('const__A_private=newWeakMap();');
    expect(output).toContain('__A_private.set(this,newA__private());');
    expect(output).toContain('__A_private.get(this).bump.call(this,n)');
    expect(output).toContain('__A_private.get(this).value');
  });

  it('adds constructor initialization after super() when class extends another class', () => {
    const source = `
      class Base {
        constructor(...args: any[]) {}
      }

      class Child extends Base {
        private count = 0;

        getCount() {
          return this.count;
        }
      }
    `;

    const output = compact(transpile(source, 'weakmap'));
    expect(output).toContain(
      'classChildextendsBase{constructor(...args){super(...args);__Child_private.set(this,newChild__private());}',
    );
    expect(output).toContain('return__Child_private.get(this).count;');
  });

  it('ignores class expressions but still handles anonymous class declarations', () => {
    const source = `
      class Named {
        private value = 1;
        read() {
          return this.value;
        }
      }

      const Expr = class {
        private value = 2;
        read() {
          return this.value;
        }
      };

      export default class {
        private value = 3;
        read() {
          return this.value;
        }
      }
    `;

    const output = compact(transpile(source, 'hash'));
    expect(output).toContain('classNamed{#value=1;read(){returnthis.#value;}}');
    expect(output).toContain('constExpr=class{value=2;read(){returnthis.value;}};');
    expect(output).toContain('exportdefaultclass{#value=3;read(){returnthis.#value;}}');
  });

  it('avoids hash private name collisions in hash mode', () => {
    const source = `
      class A {
        #value = 10;
        private value = 1;
        private static value = 2;

        getValue() {
          return this.value;
        }

        static getStaticValue() {
          return this.value;
        }
      }
    `;

    const output = compact(transpile(source, 'hash'));
    expect(output).toContain('#value=10;');
    expect(output).toContain('#value_1=1;');
    expect(output).toContain('static#value_2=2;');
    expect(output).toContain('returnthis.#value_1;');
    expect(output).toContain('returnthis.#value_2;');
  });

  it('removes private declarations from d.ts when hidePrivateDeclarations is true', () => {
    const source = `
      export class A {
        private a = 1;
        protected p = 2;
        q = 3;
        private m() {}
        constructor(private c: number) {}
      }
    `;

    const dts = compact(emitDts(source, true));
    expect(dts).not.toContain('privatea');
    expect(dts).not.toContain('privatem');
    expect(dts).not.toContain('privatec');
    expect(dts).toContain('protectedp:number;');
    expect(dts).toContain('q:number;');
  });
});
