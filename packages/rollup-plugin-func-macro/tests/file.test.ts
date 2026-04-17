import { describe, it, expect } from 'vitest';
import { funcMacro } from '../src/func.js';
import { pr, apply } from './utils.js';

describe('funcMacro', () => {
  it('should replace __file__ with file name', () => {
    const plugin = funcMacro();
    const code = pr`function testFunc() {
                      console.log("File:", __file__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"test.js"');
    expect(result).not.toContain('__file__');
  });

  it('should handle custom file identifier', () => {
    const plugin = funcMacro({ fileIdentifier: '__filename__' });
    const code = pr`function testFunc() {
                      console.log("File:", __filename__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"test.js"');
    expect(result).not.toContain('__filename__');
  });

  it('should handle both __func__ and __file__ in same code', () => {
    const plugin = funcMacro();
    const code = pr`function testFunc() {
                      console.log("Function:", __func__, "File:", __file__);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"testFunc"');
    expect(result).toContain('"test.js"');
    expect(result).not.toContain('__func__');
    expect(result).not.toContain('__file__');
  });

  it('should handle __file__ in string literals', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunc() {
                      console.log("Running in __file__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('"Running in test.js"');
    expect(result).not.toContain('__file__');
  });

  it('should handle __file__ in template literals', () => {
    const plugin = funcMacro({ stringReplace: true });
    const code = pr`function testFunc() {
                      console.log(\`Running in __file__ from \${__func__}\`);
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBeTruthy();
    expect(result).toContain('`Running in test.js from testFunc`');
    expect(result).not.toContain('__file__');
    expect(result).not.toContain('__func__');
  });
});
