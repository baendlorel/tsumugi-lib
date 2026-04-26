import { join } from 'node:path';
import type { OutputChunk } from 'rollup';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import { describe, expect, it } from 'vitest';
import hidePrivate, { stripHiddenDeclarations } from '../src/index.js';

const fixturePath = join(import.meta.dirname, '.mock', 'entry.ts');

describe('stripHiddenDeclarations', () => {
  it('removes private and protected members by default', () => {
    const code = `
export declare class Example {
  visible: string;
  private hiddenToken: string;
  protected hiddenCount: number;
  protected hiddenMethod(): void;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'example.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('hiddenToken');
    expect(result.code).not.toContain('hiddenCount');
    expect(result.code).not.toContain('hiddenMethod');
    expect(result.map?.version).toBe(3);
    expect(result.map?.file).toBe('example.d.ts');
    expect(result.map?.sources).toEqual(['example.d.ts']);
  });

  it('removes members matched by allNames regardless of visibility', () => {
    const code = `
export declare class Example {
  visible: string;
  debugOnly: string;
  private keepPrivate: string;
  protected keepProtected(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: false,
        protectedNames: false,
        allNames: ['debugOnly'],
      },
      'all-names.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly');
    expect(result.code).toContain('keepPrivate');
    expect(result.code).toContain('keepProtected');
  });

  it('supports name filtering for private and protected members', () => {
    const code = `
export declare class Example {
  private dropToken: string;
  private keepToken: string;
  protected dropMethod(): void;
  protected keepMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: [/^drop/],
        protectedNames: ['dropMethod'],
      },
      'filtered.d.ts',
    );

    expect(result.code).not.toContain('dropToken');
    expect(result.code).toContain('keepToken');
    expect(result.code).not.toContain('dropMethod');
    expect(result.code).toContain('keepMethod');
  });

  it('rejects invalid allNames values', () => {
    const code = `
export declare class Example {
  visible: string;
}
`;

    expect(() =>
      stripHiddenDeclarations(code, { allNames: true as unknown as Array<string | RegExp> }, 'invalid-all-names.d.ts'),
    ).toThrow(TypeError);

    expect(() =>
      stripHiddenDeclarations(code, { allNames: ['visible', 1 as unknown as RegExp] }, 'invalid-all-names-item.d.ts'),
    ).toThrow(TypeError);
  });

  it('keeps members when both matchers are false', () => {
    const code = `
export declare class Example {
  private keepToken: string;
  protected keepMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: false,
        protectedNames: false,
      },
      'keep-all.d.ts',
    );

    expect(result.changed).toBe(false);
    expect(result.code).toContain('keepToken');
    expect(result.code).toContain('keepMethod');
  });

  it('removes private identifier (#private) members', () => {
    const code = `
export declare class Example {
  visible: string;
  #secretField: string;
  #privateMethod(): void;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'private-identifier.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('#secretField');
    expect(result.code).not.toContain('#privateMethod');
  });

  it('handles computed property names', () => {
    const code = `
export declare class Example {
  visible: string;
  private ["computedPrivate"]: string;
  protected [computedProtected]: number;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: true,
        protectedNames: true,
        allNames: ['computedPrivate'],
      },
      'computed.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('computedPrivate');
  });

  it('returns unchanged result when no members to remove', () => {
    const code = `
export declare class Example {
  public: string;
  visible(): void;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'no-removals.d.ts');

    expect(result.changed).toBe(false);
    expect(result.code).toBe(code);
    expect(result.removedMembers).toEqual([]);
  });

  it('handles multiple classes in same file', () => {
    const code = `
export declare class First {
  private firstSecret: string;
  public firstPublic: string;
}
export declare class Second {
  private secondSecret: string;
  public secondPublic: string;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'multiple-classes.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('firstPublic: string;');
    expect(result.code).toContain('secondPublic: string;');
    expect(result.code).not.toContain('firstSecret');
    expect(result.code).not.toContain('secondSecret');
  });

  it('preserves constructor even with modifiers', () => {
    const code = `
export declare class Example {
  private field: string;
  private constructor();
  protected method(): void;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'constructor.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('constructor();');
    expect(result.code).not.toContain('field');
    expect(result.code).not.toContain('method');
  });

  it('handles allNames with RegExp patterns', () => {
    const code = `
export declare class Example {
  publicField: string;
  _internalField: string;
  __veryInternal__: string;
  private _privateInternal: string;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: true,
        protectedNames: true,
        allNames: [/^_/, /^__/],
      },
      'regexp-patterns.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('publicField: string;');
    expect(result.code).not.toContain('_internalField');
    expect(result.code).not.toContain('__veryInternal__');
    expect(result.code).not.toContain('_privateInternal');
  });

  it('allNames with privateNames only hides matching private members', () => {
    const code = `
export declare class Example {
  publicField: string;
  private _removeMe: string;
  private keepMe: string;
  protected removeMeToo: string;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: [/^_remove/],
        protectedNames: [/removeMe/],
        allNames: [/^_/],
      },
      'allnames-with-private.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('publicField: string;');
    expect(result.code).toContain('keepMe');
    expect(result.code).not.toContain('_removeMe');
    expect(result.code).not.toContain('removeMeToo');
  });

  it('can use allNames to hide specific private members', () => {
    const code = `
export declare class Example {
  private _secret: string;
  private _debug: string;
  private _prod: string;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: true,
        allNames: ['_debug'],
      },
      'specific-private.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).not.toContain('_secret');
    expect(result.code).not.toContain('_debug');
    expect(result.code).not.toContain('_prod');
  });

  it('selectively hides protected members with protectNames filter', () => {
    const code = `
export declare class Example {
  protected internalMethod(): void;
  protected internalValue(): string;
  protected keepMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        protectedNames: [/^internal/],
      },
      'selective-protected.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).not.toContain('internalMethod');
    expect(result.code).not.toContain('internalValue');
    expect(result.code).toContain('keepMethod');
  });

  it('handles getter/setter declarations', () => {
    const code = `
export declare class Example {
  private _value: string;
  get value(): string;
  set value(v: string);
  protected get internalValue(): number;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'getters-setters.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('get value(): string;');
    expect(result.code).toContain('set value(v: string);');
    expect(result.code).not.toContain('_value');
    expect(result.code).not.toContain('internalValue');
  });

  it('can remove interface members matched by allNames by default', () => {
    const code = `
export interface Example {
  visible: string;
  debugOnly: string;
  nested(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        allNames: ['debugOnly', 'nested'],
      },
      'interface-members.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly');
    expect(result.code).not.toContain('nested(): void;');
  });

  it('can remove interface members matched by interfaces patterns', () => {
    const code = `
export interface Example {
  visible: string;
  debugOnly: string;
  debugMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        interfaces: ['debugOnly', /^debugMethod$/],
      },
      'interface-patterns.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly');
    expect(result.code).not.toContain('debugMethod');
  });

  it('keeps interface members when interfaces is false', () => {
    const code = `
export interface Example {
  visible: string;
  debugOnly: string;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        interfaces: false,
      },
      'interface-false.d.ts',
    );

    expect(result.changed).toBe(false);
    expect(result.code).toContain('visible: string;');
    expect(result.code).toContain('debugOnly');
  });

  it('can remove public members matched by publicNames', () => {
    const code = `
export declare class Example {
  visible: string;
  debugOnly: string;
  debugMethod(): void;
}
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: false,
        protectedNames: false,
        publicNames: ['debugOnly', /^debugMethod$/],
      },
      'public-names.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly');
    expect(result.code).not.toContain('debugMethod');
  });

  it('can remove type literal members matched by types patterns', () => {
    const code = `
export type Example = {
  visible: string;
  debugOnly: string;
  debugMethod(): void;
};
`;

    const result = stripHiddenDeclarations(
      code,
      {
        types: ['debugOnly', /^debugMethod$/],
      },
      'types-patterns.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly');
    expect(result.code).not.toContain('debugMethod');
  });

  it('uses allNames for public, interface, and type members by default', () => {
    const code = `
export declare class ClassExample {
  visible: string;
  debugOnly: string;
}

export interface InterfaceExample {
  visible: string;
  debugOnly: string;
}

export type TypeExample = {
  visible: string;
  debugOnly: string;
};
`;

    const result = stripHiddenDeclarations(
      code,
      {
        privateNames: false,
        protectedNames: false,
        publicNames: false,
        interfaces: false,
        types: false,
        allNames: ['debugOnly'],
      },
      'all-names-everywhere.d.ts',
    );

    expect(result.changed).toBe(true);
    expect(result.code).toContain('visible: string;');
    expect(result.code).not.toContain('debugOnly: string;');
  });

  it('handles numeric and string literal member names', () => {
    const code = `
export declare class Example {
  private "stringKey": string;
  protected 123: number;
  public [computed]: any;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'literal-names.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('[computed]: any;');
    expect(result.code).not.toContain('stringKey');
    expect(result.code).not.toContain('123: number');
  });

  it('properly merges adjacent removal ranges', () => {
    const code = `
export declare class Example {
  private first: string;
  private second: string;
  public between: string;
  private third: string;
  private fourth: string;
}
`;

    const result = stripHiddenDeclarations(code, {}, 'merge-ranges.d.ts');

    expect(result.changed).toBe(true);
    expect(result.code).toContain('between: string;');
    expect(result.code).not.toContain('first');
    expect(result.code).not.toContain('second');
    expect(result.code).not.toContain('third');
    expect(result.code).not.toContain('fourth');
    expect(result.removedMembers.length).toBe(4);
  });
});

describe('rollup-plugin-hide-private', () => {
  it('generates declaration output with a sourcemap', async () => {
    const bundle = await rollup({
      input: fixturePath,
      plugins: [hidePrivate(), dts()],
    });

    try {
      const { output } = await bundle.generate({
        format: 'es',
        sourcemap: true,
        entryFileNames: 'index.d.ts',
      });

      const chunk = output.find((item): item is OutputChunk => item.type === 'chunk');
      expect(chunk).toBeDefined();
      expect(chunk?.fileName).toBe('index.d.ts');
      expect(chunk?.code).toContain('visible: string;');
      expect(chunk?.code).not.toContain('token');
      expect(chunk?.code).not.toContain('internalState');
      expect(chunk?.map?.version).toBe(3);
      expect(chunk?.map?.file).toBe('index.d.ts');
      expect(chunk?.map?.sources.length).toBeGreaterThan(0);
      expect(typeof chunk?.map?.mappings).toBe('string');
    } finally {
      await bundle.close();
    }
  });
});
