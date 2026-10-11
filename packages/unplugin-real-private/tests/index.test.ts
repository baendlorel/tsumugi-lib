import { describe, expect, it } from 'vitest';
import MagicString from 'magic-string';
import type { UnpluginOptions } from 'unplugin';
import ts from 'typescript';
import { transformModule } from '../src/core/transformer.js';
import { resolveOptions } from '../src/options.js';
import unplugin, { unpluginFactory } from '../src/index.js';
import type { RealPrivateOptions } from '../src/types.js';

/** The raw factory still asks for the framework meta object; tests do not need it. */
const createPlugin = (options: RealPrivateOptions = {}): UnpluginOptions =>
  (unpluginFactory as (options: RealPrivateOptions) => UnpluginOptions)(options);

function transform(input: string, options: RealPrivateOptions = {}) {
  const sourceFile = ts.createSourceFile('/src/entry.ts', input, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const magicString = new MagicString(input);
  const result = transformModule(sourceFile, resolveOptions(options), magicString);

  return { code: result.code, diagnostics: result.diagnostics };
}

function compact(code: string): string {
  return code.replace(/\s+/g, '');
}

/** The same call as `runTransform`, but typed to keep the sourcemap. */
function runTransformWithMap(code: string, id = '/src/entry.ts', options: RealPrivateOptions = {}) {
  const plugin = createPlugin(options);
  const context = { error: () => {}, warn: () => {} };

  return (
    plugin.transform as unknown as (
      this: typeof context,
      code: string,
      id: string,
    ) => { code: string; map?: { mappings: string } } | null
  ).call(context as never, code, id);
}

function runTransform(code: string, id = '/src/entry.ts', options: RealPrivateOptions = {}) {
  const plugin = createPlugin(options);
  const warnings: unknown[] = [];
  const context = {
    error(message: unknown) {
      throw typeof message === 'string' ? new Error(message) : Object.assign(new Error('error'), message);
    },
    warn(message: unknown) {
      warnings.push(message);
    },
  };

  const result = (
    plugin.transform as unknown as (this: typeof context, code: string, id: string) => { code: string } | null
  ).call(context as never, code, id);

  return { result, warnings };
}

describe('hash conversion', () => {
  it('converts instance and static members', () => {
    const { code, diagnostics } = transform(`
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

        run() {
          return this.inc(2);
        }
      }
    `);

    const output = compact(code);
    expect(diagnostics).toHaveLength(0);
    expect(output).toContain('classA{#count=1;static#version=0;');
    expect(output).toContain('#inc(step:number){');
    expect(output).toContain('this.#count+=step;');
    expect(output).toContain('staticnextVersion(){this.#version+=1;returnthis.#version;}');
    expect(output).toContain('returnthis.#inc(2);');
  });

  it('drops the visibility keyword but keeps static, readonly and declare', () => {
    const { code } = transform(`
      class A {
        private static readonly x = 1;
        private declare y: number;
        private z = 3;
      }
    `);

    const output = compact(code);
    expect(output).toContain('staticreadonly#x=1;');
    expect(output).toContain('declare#y:number;');
    expect(output).toContain('#z=3;');
    expect(output).not.toContain('private');
  });

  it('keeps comments and unrelated formatting intact', () => {
    const source = `class A {
  // counts things
  private count /* inline */ = 1;

  read(): number {
    return this.count; // trailing
  }
}`;

    const { code } = transform(source);
    expect(code).toContain('// counts things');
    expect(code).toContain('/* inline */');
    expect(code).toContain('// trailing');
    expect(compact(code)).toContain('#count/*inline*/=1;');
    expect(compact(code)).toContain('returnthis.#count;');
  });

  it('rewrites private members of nested classes independently', () => {
    const { code } = transform(`
      class Outer {
        private x = 1;

        make() {
          class Inner {
            private x = 2;
            read() { return this.x; }
          }
          return new Inner();
        }

        read() { return this.x; }
      }
    `);

    const output = compact(code);
    expect(output).toContain('classOuter{#x=1;');
    expect(output).toContain('classInner{#x=2;read(){returnthis.#x;}}');
    expect(output).toContain('read(){returnthis.#x;}');
  });

  it('leaves a nested class untouched when only the outer class has private members', () => {
    const { code } = transform(`
      class Outer {
        private x = 1;
        make() {
          return class {
            read(other) { return other.x; }
          };
        }
      }
    `);

    expect(compact(code)).toContain('classOuter{#x=1;');
    expect(compact(code)).toContain('read(other){returnother.x;}');
  });

  it('resolves optional chaining on private members', () => {
    const { code } = transform(`
      class A {
        private cache?: Map<string, number>;
        read() { return this.cache?.get('a'); }
      }
    `);

    expect(compact(code)).toContain('this.#cache?.get(');
  });

  it('declares the private field for parameter properties and assigns it in the constructor', () => {
    const { code } = transform(`
      class A {
        private x: number = 1;
        constructor(private y: number, public readonly z: string) {}
      }
    `);

    const output = compact(code);
    expect(output).toContain('constructor(y:number,publicreadonlyz:string){this.#y=y;}');
    expect(output).toContain('#y:number'); // the field declaration is added
    expect(output).not.toContain('#z'); // `public readonly z` stays public
  });

  it('assigns parameter properties after super() in a derived class', () => {
    const { code } = transform(`
      class Base {
        constructor(readonly tag: string) {}
      }

      class Child extends Base {
        constructor(private count: number) {
          super('child');
          console.log(this.count);
        }
      }
    `);

    expect(compact(code)).toContain("super('child');this.#count=count;");
  });

  it('rewrites this.x assignments inside static blocks into this.#x', () => {
    const { code } = transform(`
      class A {
        private static count = 0;
        static { this.count = 1; }
      }
    `);

    expect(compact(code)).toContain('static{this.#count=1;}');
  });

  it('rewrites static members reached through the class name', () => {
    const { code } = transform(`
      class A {
        private static instances = 0;
        private static bump() { return A.instances++; }
        constructor() { A.instances += 1; }
      }
    `);

    const output = compact(code);
    expect(output).toContain('static#instances=0;');
    expect(output).toContain('static#bump(){returnA.#instances++;}');
    expect(output).toContain('constructor(){A.#instances+=1;}');
  });

  it('ignores non-private and computed members', () => {
    const { code } = transform(`
      class A {
        public open = 1;
        protected shared = 2;
        ['computed'] = 3;
        private m() { return this.open + this.shared; }
      }
    `);

    const output = compact(code);
    expect(output).toContain('publicopen=1;');
    expect(output).toContain('protectedshared=2;');
    expect(output).toContain("['computed']=3;");
    expect(output).toContain('#m(){');
  });
});

describe('collision detection', () => {
  const source = `
    class A {
      private x: number = 1;
      #x: string = 'a';
    }
  `;

  it('reports an error with the location of the offending member', () => {
    const { diagnostics, code } = transform(source);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].category).toBe(ts.DiagnosticCategory.Error);
    expect(diagnostics[0].message).toContain('already declares a "#x" member');
    expect(code).toContain('private x'); // the class is left untouched
  });

  it('detects collisions against static and accessor private members too', () => {
    expect(
      transform(`
        class A {
          private x = 1;
          static #x = 2;
        }
      `).diagnostics,
    ).toHaveLength(1);

    expect(
      transform(`
        class A {
          private x = 1;
          get #x() { return 1; }
        }
      `).diagnostics,
    ).toHaveLength(1);
  });

  it('reports each clashing member separately', () => {
    const { diagnostics } = transform(`
      class A {
        private x = 1;
        private y = 2;
        #x = 3;
        #y = 4;
      }
    `);

    expect(diagnostics).toHaveLength(2);
  });

  it('downgrades to a warning when silent is enabled', () => {
    const { diagnostics } = transform(source, { silent: true });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].category).toBe(ts.DiagnosticCategory.Warning);
  });

  it('does not treat a private member and a plain member with the same name as a collision', () => {
    const { diagnostics } = transform(`
      class A {
        x = 1;
        private y = 2;
        m() { return this.x + this.y; }
      }
    `);

    expect(diagnostics).toHaveLength(0);
  });
});

describe('plugin factory', () => {
  it('errors through the bundler when a collision is found', () => {
    expect(() => runTransform('class A { private x = 1; #x = 2; }')).toThrowError(/already declares a "#x" member/);
  });

  it('warns through the bundler when silent is enabled', () => {
    const { warnings } = runTransform('class A { private x = 1; #x = 2; }', '/src/entry.ts', { silent: true });
    expect(warnings).toHaveLength(1);
  });

  it('uses the mode option and rejects unknown values', () => {
    expect(() => createPlugin({ mode: 'weakmap' as never })).toThrowError(/Only "hash" is supported/);
  });

  it('skips non-typescript modules', () => {
    const { result } = runTransform('const a = 1;', '/src/entry.js');
    expect(result).toBeNull();
  });

  it('applies include and exclude filters', () => {
    const code = 'class A { private x = 1; }';

    expect(runTransform(code, '/src/skip.ts', { include: ['src/keep'] }).result).toBeNull();
    expect(runTransform(code, '/src/keep/a.ts', { include: ['src/keep'] }).result?.code).toContain('#x');

    expect(runTransform(code, '/src/vendor/a.ts', { exclude: ['vendor'] }).result).toBeNull();
    expect(runTransform(code, '/src/app/a.ts', { exclude: ['vendor'] }).result?.code).toContain('#x');
  });

  it('returns null when a module has no private members', () => {
    const { result } = runTransform('class A { x = 1; read() { return this.x; } }');
    expect(result).toBeNull();
  });

  it('is a valid unplugin with bundler entries', () => {
    expect(unplugin.raw({}, {} as never)).toBeTypeOf('object');
    expect(typeof unplugin.vite).toBe('function');
    expect(typeof unplugin.rollup).toBe('function');
    expect(typeof unplugin.webpack).toBe('function');
    expect(typeof unplugin.rspack).toBe('function');
    expect(typeof unplugin.esbuild).toBe('function');
  });

  it('produces a sourcemap', () => {
    const { result } = runTransform('class A { private x = 1; }', '/src/entry.ts');
    expect(result?.code).toContain('#x');
    expect(runTransformWithMap('class A { private x = 1; }')?.map?.mappings).toBeTruthy();
  });
});

describe('runtime behaviour', () => {
  /** Runs the converted module the way a bundler would: TypeScript strips the types, then Node evaluates it. */
  function evaluate(source: string, options: RealPrivateOptions = {}): Record<string, unknown> {
    const plugin = createPlugin(options);
    const context = {
      error(message: unknown) {
        throw new Error(typeof message === 'string' ? message : String((message as { message?: string })?.message));
      },
      warn() {},
    };

    const transformed = (
      plugin.transform as unknown as (this: typeof context, code: string, id: string) => { code: string } | null
    ).call(context as never, source, '/src/entry.ts');

    if (!transformed) {
      throw new Error('the module was not transformed');
    }

    // A later loader would still strip the remaining type annotations.
    const javascript = ts.transpileModule(transformed.code, {
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS },
    }).outputText;

    const exports: Record<string, unknown> = {};
    new Function('exports', 'module', javascript)(exports, { exports });
    return exports;
  }

  it('keeps instance, static and parameter-property behaviour identical', () => {
    const exports = evaluate(`
      export class Counter {
        private count = 0;
        private static instances = 0;
        private label: string;

        constructor(private step: number, label = 'counter') {
          this.label = label;
          Counter.instances += 1;
        }

        private bump(): number {
          this.count += this.step;
          return this.count;
        }

        static get created(): number {
          return Counter.instances;
        }

        run(times = 1): string {
          let last = this.count;
          for (let i = 0; i < times; i++) last = this.bump();
          return \`\${this.label}: \${last}\`;
        }
      }

      export const report = () => {
        const counter = new Counter(3, 'main');
        return [counter.run(2), Counter.created, counter.run(1)];
      };
    `);

    expect((exports.report as () => unknown[])()).toEqual(['main: 6', 1, 'main: 9']);
  });

  it('keeps subclass behaviour when a base parameter property is overwritten', () => {
    const exports = evaluate(`
      export class Base {
        constructor(private tag: string) {}
        describe(): string { return this.tag; }
      }

      export class Child extends Base {
        private extra: number;
        constructor() {
          super('base');
          this.extra = 2;
        }
        describe(): string { return super.describe() + this.extra; }
      }

      export const run = () => new Child().describe();
    `);

    expect((exports.run as () => string)()).toBe('base2');
  });

  it('hides the members from the outside', () => {
    const exports = evaluate(`
      export class A {
        private secret = 42;
        constructor(private key: string) {}
        reveal() { return this.secret + this.key; }
      }
      export const probe = () => {
        const a = new A('k');
        return [a.reveal(), 'secret' in a, Object.getOwnPropertyNames(a).length];
      };
    `);

    expect((exports.probe as () => unknown[])()).toEqual([42 + 'k', false, 0]);
  });

  it('keeps a static block assignment working', () => {
    const exports = evaluate(`
      export class A {
        private static count = 0;
        private value = 1;
        static { A.count = 5; }
        static get count2() { return A.count; }
        get doubled() { return this.value * 2; }
      }
      export const run = () => [A.count2, new A().doubled];
    `);

    expect((exports.run as () => unknown[])()).toEqual([5, 2]);
  });

  it('leaves a class collision untouched and unreachable at runtime', () => {
    expect(() => evaluate('class A { private x = 1; #x = 2; }')).toThrowError(/already declares a "#x" member/);
  });
});
