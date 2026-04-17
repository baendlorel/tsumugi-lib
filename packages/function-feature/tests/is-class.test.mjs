import { describe, it, expect } from 'vitest';
import { isClass } from '../lib/index.mjs';

describe('isClass', () => {
  it('should return true for class declarations', () => {
    class TestClass {}
    expect(isClass(TestClass)).toBe(true);
  });

  it('should return true for class expressions', () => {
    const TestClass = class {};
    expect(isClass(TestClass)).toBe(true);
  });

  it('should return true for native constructors', () => {
    expect(isClass(Array)).toBe(true);
    expect(isClass(Object)).toBe(true);
    expect(isClass(Function)).toBe(true);
    expect(isClass(Boolean)).toBe(true);
    expect(isClass(Number)).toBe(true);
    expect(isClass(String)).toBe(true);
    expect(isClass(Date)).toBe(true);
    expect(isClass(RegExp)).toBe(true);
    expect(isClass(Error)).toBe(true);
  });

  it('should return false for regular functions', () => {
    function regularFunction() {}
    expect(isClass(regularFunction)).toBe(false);
  });

  it('should return false for arrow functions', () => {
    const arrowFunction = () => {};
    expect(isClass(arrowFunction)).toBe(false);
  });

  it('should return false for async functions', () => {
    async function asyncFunction() {}
    expect(isClass(asyncFunction)).toBe(false);
  });

  it('should return false for generator functions', () => {
    function* generatorFunction() {}
    expect(isClass(generatorFunction)).toBe(false);
  });

  it('should work with bound classes', () => {
    class TestClass {}
    const boundClass = TestClass.bind(null);
    expect(isClass(boundClass)).toBe(true);
  });

  it('should work with bound functions', () => {
    function regularFunction() {}
    const boundFunction = regularFunction.bind(null);
    expect(isClass(boundFunction)).toBe(false);
  });
});
