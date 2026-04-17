import { describe, expect, it } from 'vitest';
import { compose } from '../src/index.js';

describe('compose', () => {
  it('throws when the first argument is not constructable', () => {
    expect(() => compose((() => {}) as any, [{ value: 1 }])).toThrow(TypeError);
    expect(() => compose((() => {}) as any, [{ value: 1 }])).toThrow(/First argument must be a non-arrow function/);
  });

  it('creates instances with constructor state and composed prototype members', () => {
    const statePart = {
      id: 0,
      name: '',
    };

    const renamable = {
      rename(this: typeof statePart, next: string) {
        this.name = next;
        return this.name;
      },
    };

    const describable = {
      get label() {
        const self = this as unknown as typeof statePart;
        return `${self.id}:${self.name}`;
      },
    };

    type PersonInstance = typeof statePart & typeof renamable & typeof describable;

    const Person = compose(
      function Person(this: PersonInstance, id: number, name: string) {
        this.id = id;
        this.name = name;
      },
      statePart,
      renamable,
      describable,
    );
    const instance = new Person(7, 'Ada');

    expect(instance).toBeInstanceOf(Person);
    expect(instance.id).toBe(7);
    expect(instance.name).toBe('Ada');
    expect(instance.label).toBe('7:Ada');
    expect(instance.rename('Grace')).toBe('Grace');
    expect(instance.label).toBe('7:Grace');
  });

  it('preserves property descriptors from composed parts', () => {
    const hiddenPart = {};
    Object.defineProperty(hiddenPart, 'secret', {
      value(this: { token?: string }) {
        return this.token ?? 'fallback';
      },
      enumerable: false,
      configurable: true,
      writable: false,
    });

    function Model(this: typeof hiddenPart): typeof hiddenPart {
      return this;
    }

    const ModelWithHiddenPart = compose(Model, hiddenPart);
    const descriptor = Object.getOwnPropertyDescriptor(ModelWithHiddenPart.prototype, 'secret');

    expect(descriptor).toMatchObject({
      enumerable: false,
      configurable: true,
      writable: false,
    });
    expect(typeof descriptor?.value).toBe('function');
  });

  it('lets later parts override earlier prototype members', () => {
    const firstPart = {
      format() {
        return 'first';
      },
    };

    const secondPart = {
      format() {
        return 'second';
      },
    };

    function Model(this: typeof firstPart & typeof secondPart): typeof firstPart & typeof secondPart {
      return this;
    }

    const First = compose(Model, firstPart, secondPart);

    expect(new First().format()).toBe('second');
  });

  it('copies the source constructor name onto the generated class', () => {
    const valuePart = {
      value: 1,
    };

    function NamedModel(this: typeof valuePart): typeof valuePart {
      return this;
    }

    const Mixed = compose(NamedModel, valuePart);

    expect(Mixed.name).toBe('NamedModel');
  });
});
