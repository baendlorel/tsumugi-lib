import { expect, describe, it } from 'vitest';
import { singletonify, getSingletonTarget } from '../src/singleton-wrapper.js';

describe('singletonify', () => {
  it('should always return the same instance', () => {
    class TestClass {
      value: number;
      constructor(v: number) {
        this.value = v;
      }
    }
    const Singleton = singletonify(TestClass);
    const a = new Singleton(1);
    const b = new Singleton(2);
    expect(a).toBe(b);
    expect(a.value).toBe(1);
  });

  it('prototype.constructor of singleton is proxied by default', () => {
    class TestClass {}
    const Singleton = singletonify(TestClass);

    expect(Singleton.prototype.constructor).toBe(Singleton);
  });

  it('prototype.constructor of target class is itself', () => {
    class TestClass {}

    expect(TestClass.prototype.constructor).toBe(TestClass);
  });

  it('can keep original prototype.constructor if option is set', () => {
    class TestClass {}
    const Singleton = singletonify(TestClass, { changeProtoConstructor: false });

    expect(Singleton.prototype.constructor).toBe(TestClass);
  });

  it('should set prototype.constructor to proxy when changeProtoConstructor is true or undefined', () => {
    class TestClass {}
    const Singleton1 = singletonify(TestClass);
    expect(Singleton1.prototype.constructor).toBe(Singleton1);

    const Singleton2 = singletonify(TestClass, {});
    expect(Singleton2.prototype.constructor).toBe(Singleton2);
  });

  it('should keep original prototype.constructor when changeProtoConstructor is false', () => {
    class TestClass {}
    const Singleton = singletonify(TestClass, { changeProtoConstructor: false });
    expect(Singleton.prototype.constructor).toBe(TestClass);
  });

  it('getSingletonTarget returns original class', () => {
    class TestClass {}
    const Singleton = singletonify(TestClass);

    expect(getSingletonTarget(Singleton)).toBe(TestClass);
    expect(getSingletonTarget(TestClass)).toBeUndefined();
  });

  it('should return same proxy if onlyOnce is true', () => {
    class TestClass {}
    const Singleton1 = singletonify(TestClass, { onlyOnce: true });
    const Singleton2 = singletonify(TestClass, { onlyOnce: true });

    expect(Singleton1).toBe(Singleton2);
  });

  it('should create new proxy if onlyOnce is false', () => {
    class TestClass {}
    const Singleton1 = singletonify(TestClass, { onlyOnce: false });
    const Singleton2 = singletonify(TestClass, { onlyOnce: false });

    expect(Singleton1).not.toBe(Singleton2);
  });

  it('should treat undefined/true/other as onlyOnce true', () => {
    class TestClass {}
    const Singleton1 = singletonify(TestClass, { onlyOnce: undefined });
    const Singleton2 = singletonify(TestClass, { onlyOnce: true });

    expect(Singleton1).toBe(Singleton2);
  });
});
