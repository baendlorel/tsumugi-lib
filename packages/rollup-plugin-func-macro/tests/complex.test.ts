import { expect, describe, it } from 'vitest';
import { funcMacro } from '../src/func.js';
import { apply, pr } from './utils.js';

describe('funcMacro', () => {
  it('should handle dynamic name', () => {
    const plugin = funcMacro({});
    const code = pr`class TestClass {
                      ['dynamicMethod']() {
                        console.log(__func__);
                      }
                    };`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBe(pr`class TestClass {
                            ['dynamicMethod']() {
                              console.log("dynamicMethod");
                            }
                           };`);
  });

  it('should handle complex situations', () => {
    const plugin = funcMacro({});
    const code = pr`class TestClass {
                      ['dynamicMethod']() {
                        console.log(__func__);
                      }
                    };
                    function testFunction() {
                      const name = __func__ + '2323';
                      function innter() {
                        console.log("Current: __func__",__func__);
                      }
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBe(pr`class TestClass {
                            ['dynamicMethod']() {
                              console.log("dynamicMethod");
                            }
                          };
                          function testFunction() {
                            const name = "testFunction" + '2323';
                            function innter() {
                              console.log("Current: innter","innter");
                            }
                          }`);
  });

  it('should be literal', () => {
    const plugin = funcMacro({ fallback: '???' });
    const code = pr`class TestClass {
                      ['dynamicMethod'+ getName() + "asdf"]() {
                        const name = __func__;
                      }
                    };`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBe(pr`class TestClass {
                            ['dynamicMethod'+ getName() + "asdf"]() {
                              const name = "'dynamicMethod'+ getName() + \\"asdf\\"";
                            }
                          };`);
  });

  it('should be [Invalid] when using __func__ in method name', () => {
    const plugin = funcMacro({ fallback: '???' });
    const code = pr`class TestClass {
                      ['dynamicMethod'+ __func__]() {
                      }
                    }`;

    const result = apply(plugin, code, 'test.js');
    expect(result).toBe(pr`class TestClass {
                            ['dynamicMethod'+ "[Invalid]"]() {
                            }
                          }`);
  });

  it('should I dont know either', () => {
    const plugin = funcMacro({});
    const code = pr`function tt(){
                      console.log('__func__'+__func__+\`\${__func__+'2323'}\` + \`\${__func__}\` + "__func__");
                    }`;

    const result = apply(plugin, code, 'test.js');
    console.log(result);
    expect(result).toBe(pr`function tt(){
                             console.log("tt"+"tt"+\`\${"tt"+'2323'}\` + \`tt\` + "tt");
                           }`);
  });
});
