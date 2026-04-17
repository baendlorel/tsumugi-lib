import { expect, describe, it } from 'vitest';
import { funcMacro } from '../src/func.js';
import { apply, pr } from './utils.js';

describe('funcMacro', () => {
  it('should replace __func__ in function declaration', () => {
    const plugin = funcMacro();
    const code = pr`function testFunction() {
                    console.log(__func__);
                  }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"testFunction"');
    expect(result).not.toContain('__func__');
  });

  it('should replace __func__ in function expression', () => {
    const plugin = funcMacro();
    const code = pr`const myFunc = function namedFunc() {
                    return __func__;
                  };`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"namedFunc"');
    expect(result).not.toContain('__func__');
  });

  it('should replace __func__ in class method', () => {
    const plugin = funcMacro();
    const code = pr`class TestClass {
                       myMethod() {
                         console.log(__func__);
                       }
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"myMethod"');
    expect(result).not.toContain('__func__');
  });

  it('should use fallback when no function name found', () => {
    const plugin = funcMacro({ fallback: 'fallback_name' });
    const code = `console.log(__func__);`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"fallback_name"');
  });

  it('should handle custom identifier', () => {
    const plugin = funcMacro({ identifier: '__function_name__' });
    const code = pr`function testFunc() {
                      console.log(__function_name__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"testFunc"');
    expect(result).not.toContain('__function_name__');
  });

  it('should skip arrow functions', () => {
    const plugin = funcMacro();
    const code = pr`function outerFunc() {
                      const arrow = () => {
                        console.log(__func__);
                      };
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    // Should find outerFunc, not the arrow function
    expect(result).toContain('"outerFunc"');
  });

  it('should handle nested functions correctly', () => {
    const plugin = funcMacro();
    const code = pr`function outerFunc() {
                      console.log(__func__); // Should be "outerFunc"
                      
                      function innerFunc() {
                        console.log(__func__); // Should be "innerFunc"
                      }
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"outerFunc"');
    expect(result).toContain('"innerFunc"');
  });

  it('should not transform files that do not match filter', () => {
    const plugin = funcMacro({ exclude: ['**/test.js'] });
    const code = pr`function testFunc() {
                      console.log(__func__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeNull();
  });

  it('should not transform when identifier is not present', () => {
    const plugin = funcMacro();
    const code = pr`function testFunc() {
                      console.log("hello");
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeNull();
  });

  it('should handle multiple identifiers in the same function', () => {
    const plugin = funcMacro();
    const code = pr`function testFunc() {
                      console.log("Function name:", __func__);
                      console.log("Called from:", __func__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"testFunc"');
    expect(result).not.toContain('__func__');
    // Should replace both occurrences
    expect((result?.match(/"testFunc"/g) || []).length).toBe(2);
  });

  it('should allow disabling __func__ replacement', () => {
    const plugin = funcMacro({ identifier: null });
    const code = pr`function testFunc() {
                      console.log(__func__, __file__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toContain('__func__');
    expect(result).toContain('"test.js"');
  });

  it('should allow disabling __file__ replacement', () => {
    const plugin = funcMacro({ fileIdentifier: null });
    const code = pr`function testFunc() {
                      console.log(__func__, __file__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toContain('"testFunc"');
    expect(result).toContain('__file__');
  });

  it('should accept include and exclude as string', () => {
    const plugin = funcMacro({ include: '**/*.js', exclude: '**/*.skip.js' });
    const code = pr`function testFunc() {
                      console.log(__func__);
                    }`;

    const transformed = apply(plugin, code, 'test.js');
    const skipped = apply(plugin, code, 'test.skip.js');
    expect(transformed).toContain('"testFunc"');
    expect(skipped).toBeNull();
  });
});
