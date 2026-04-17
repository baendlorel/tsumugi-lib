import { describe, it, expect } from 'vitest';
import { funcMacro } from '../src/func.js';
import { pr, apply } from './utils.js';

describe('String replacement functionality', () => {
  it('should replace __func__ in string literals when stringReplace is true', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunction() {
                      console.log("Current function: __func__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    console.log(result);
    expect(result).toBe(pr`function testFunction() {
                          console.log("Current function: testFunction");
                        }`);
  });

  it('should NOT replace __func__ in string literals when stringReplace is false', () => {
    const plugin = funcMacro({ stringReplace: false });
    const code = pr`function testFunction() {
                      console.log("Current function: __func__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeNull(); // No transformation should occur
  });

  it('should replace __func__ in template literals when stringReplace is true', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunction() {
                      console.log(\`Current function: __func__\`);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBe(pr`function testFunction() {
                             console.log(\`Current function: testFunction\`);
                           }`);
  });

  it('should replace multiple __func__ occurrences in same string', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunction() {
                      console.log("__func__ called __func__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"testFunction called testFunction"');
  });

  it('should handle template literals with expressions', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunction() {
                      const x = 42;
                      console.log(\`Function __func__ with value \${x}\`);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('`Function testFunction with value ${x}`');
  });

  it('should replace both identifier and string occurrences', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunction() {
                      const name = __func__;
                      console.log("Function name is __func__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"testFunction"');
    expect(result).toContain('"Function name is testFunction"');
    expect(result).not.toContain('__func__');
  });

  it('should use custom identifier in strings', () => {
    const plugin = funcMacro({
      identifier: '__FUNCTION_NAME__',
      stringReplace: true,
    });
    const code = pr`function testFunction() {
                      console.log("Current: __FUNCTION_NAME__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"Current: testFunction"');
  });
});
