import { expect, describe, it } from 'vitest';
// import { ReflectDeep } from '../dist';
import { ReflectDeep } from '../src/index.js';

describe('ReflectDeep 深度反射测试', () => {
  describe('deleteProperty 删除嵌套属性测试', () => {
    it('应该删除存在的嵌套属性', () => {
      const obj = { a: { b: { c: 123, d: 456 } } };
      const result = ReflectDeep.deleteProperty(obj, ['a', 'b', 'c']);
      expect(result).toBe(true);
      expect('c' in obj.a.b).toBe(false);
      expect(obj.a.b.d).toBe(456);
    });

    it('应该删除顶层属性', () => {
      const obj = { x: 1, y: 2 };
      const result = ReflectDeep.deleteProperty(obj, ['x']);
      expect(result).toBe(true);
      expect('x' in obj).toBe(false);
      expect(obj.y).toBe(2);
    });

    it('删除不存在的属性应返回true，和原版一致', () => {
      const obj = { a: { b: 1 } };
      const result = ReflectDeep.deleteProperty(obj, ['a', 'c']);
      expect(result).toBe(true);
      expect(obj.a.b).toBe(1);
    });

    it('路径中遇到基本类型应返回false', () => {
      const obj = { a: { b: 123 } };
      const result = ReflectDeep.deleteProperty(obj, ['a', 'b', 'c']);
      expect(result).toBe(false);
    });

    it('删除Symbol属性', () => {
      const sym = Symbol('s');
      const obj = { [sym]: { inner: 1 } };
      const result = ReflectDeep.deleteProperty(obj, [sym, 'inner']);
      expect(result).toBe(true);
      expect('inner' in obj[sym]).toBe(false);
    });

    it('参数无效时应抛出错误', () => {
      expect(() => ReflectDeep.deleteProperty(null as any, ['a'])).toThrow(TypeError);
      expect(() => ReflectDeep.deleteProperty({}, [] as any)).toThrow(TypeError);
    });
  });

  describe('defineProperty() 定义嵌套属性测试', () => {
    it('应该定义嵌套属性', () => {
      const obj = {};
      const result = ReflectDeep.defineProperty(obj, ['a', 'b', 'c'], {
        value: 'hello',
        writable: true,
        enumerable: true,
        configurable: true,
      });

      expect(result).toBe(true);
      expect((obj as any).a.b.c).toBe('hello');
    });

    it('应该定义不可写属性', () => {
      const obj = { a: {} };
      const result = ReflectDeep.defineProperty(obj, ['a', 'readonly'], {
        value: 'fixed',
        writable: false,
        enumerable: true,
        configurable: true,
      });

      expect(result).toBe(true);
      expect((obj as any).a.readonly).toBe('fixed');

      // 尝试修改不可写属性
      let threw = false;
      try {
        (obj as any).a.readonly = 'changed';
      } catch (e) {
        threw = true;
        expect(e).toBeInstanceOf(TypeError);
      }
      // 严格模式下应抛异常，非严格模式下值不变
      if (!threw) {
        expect((obj as any).a.readonly).toBe('fixed'); // 值未改变
      }
    });

    it('应该定义getter/setter属性', () => {
      const obj = { a: {} };
      let value = 'initial';

      const result = ReflectDeep.defineProperty(obj, ['a', 'prop'], {
        get() {
          return value;
        },
        set(v) {
          value = v;
        },
        enumerable: true,
        configurable: true,
      });

      expect(result).toBe(true);
      expect((obj as any).a.prop).toBe('initial');

      (obj as any).a.prop = 'modified';
      expect((obj as any).a.prop).toBe('modified');
    });

    it('应该定义Symbol属性', () => {
      const sym = Symbol('test');
      const obj = {};

      const result = ReflectDeep.defineProperty(obj, ['nested', sym], {
        value: 'symbol value',
        writable: true,
        enumerable: false,
        configurable: true,
      });

      expect(result).toBe(true);
      expect((obj as any).nested[sym]).toBe('symbol value');
    });

    it('路径中遇到基本类型应返回false', () => {
      const obj = { a: { b: 'string' } };
      const result = ReflectDeep.defineProperty(obj, ['a', 'b', 'c'], {
        value: 'test',
      });

      expect(result).toBe(false);
    });

    it('应该覆盖已存在的属性', () => {
      const obj = { a: { b: { old: 'value' } } };
      const result = ReflectDeep.defineProperty(obj, ['a', 'b', 'old'], {
        value: 'new value',
        writable: false,
      });

      expect(result).toBe(true);
      expect(obj.a.b.old).toBe('new value');
    });

    it('参数无效时应抛出错误', () => {
      expect(() => ReflectDeep.defineProperty(null as any, ['a'], {})).toThrow(TypeError);
      expect(() => ReflectDeep.defineProperty({}, [] as any, {})).toThrow(TypeError);
    });
  });

  describe('get() 获取嵌套属性测试', () => {
    const testObj = {
      a: {
        b: {
          c: 'hello',
          d: [1, 2, { e: 'world' }],
        },
      },
      arr: [{ nested: 'value' }],
      null: null,
      zero: 0,
      false: false,
    };

    it('应该获取存在的嵌套属性', () => {
      expect(ReflectDeep.get(testObj, ['a', 'b', 'c'])).toBe('hello');
      expect(ReflectDeep.get(testObj, ['a', 'b', 'd', 2, 'e'])).toBe('world');
      expect(ReflectDeep.get(testObj, ['arr', 0, 'nested'])).toBe('value');
    });

    it('应该获取假值属性', () => {
      expect(ReflectDeep.get(testObj, ['null'])).toBe(null);
      expect(ReflectDeep.get(testObj, ['zero'])).toBe(0);
      expect(ReflectDeep.get(testObj, ['false'])).toBe(false);
    });

    it('应该在属性不存在时返回 undefined', () => {
      expect(ReflectDeep.get(testObj, ['a', 'nonexistent'])).toBe(undefined);
      expect(ReflectDeep.get(testObj, ['a', 'b', 'c', 'too', 'deep'])).toBe(undefined);
      expect(ReflectDeep.get(testObj, ['completely', 'missing'])).toBe(undefined);
    });

    it('应该在路径中遇到基本类型时返回 undefined', () => {
      expect(ReflectDeep.get(testObj, ['a', 'b', 'c', 'further'])).toBe(undefined);
      expect(ReflectDeep.get(testObj, ['zero', 'property'])).toBe(undefined);
    });

    it('应该在参数无效时抛出错误', () => {
      expect(() => ReflectDeep.get(null as any, ['a'])).toThrow(TypeError);
      expect(() => ReflectDeep.get(testObj, [] as any)).toThrow(TypeError);
      expect(() => ReflectDeep.get(testObj, 'invalid' as any)).toThrow(TypeError);
    });
  });

  describe('set() 设置嵌套属性测试', () => {
    it('应该设置存在路径的属性', () => {
      const obj = { a: { b: { c: 'old' } } };
      const result = ReflectDeep.set(obj, ['a', 'b', 'c'], 'new');

      expect(result).toBe(true);
      expect(obj.a.b.c).toBe('new');
    });

    it('应该创建不存在的中间对象', () => {
      const obj = {};
      const result = ReflectDeep.set(obj, ['a', 'b', 'c'], 'value');

      expect(result).toBe(true);
      expect((obj as any).a.b.c).toBe('value');
    });

    it('应该处理数组索引', () => {
      const obj = { arr: [] };
      const result = ReflectDeep.set(obj, ['arr', 0], 'first');

      expect(result).toBe(true);
      expect(obj.arr[0]).toBe('first');
    });

    it('应该在遇到基本类型时失败并返回 false', () => {
      const obj = { a: { b: 'string' } };
      const result = ReflectDeep.set(obj, ['a', 'b', 'c'], 'value');

      expect(result).toBe(false);
    });

    it('应该处理 Symbol 键', () => {
      const sym = Symbol('test');
      const obj = {};
      const result = ReflectDeep.set(obj, [sym], 'value');

      expect(result).toBe(true);
      expect((obj as any)[sym]).toBe('value');
    });

    it('应该在参数无效时抛出错误', () => {
      expect(() => ReflectDeep.set(null as any, ['a'], 'value')).toThrow(TypeError);
      expect(() => ReflectDeep.set({}, [], 'value')).toThrow(TypeError);
    });
  });

  describe('has() 检查属性存在测试', () => {
    const testObj = {
      a: {
        b: {
          c: 'value',
          d: null,
          e: undefined,
          f: 0,
          g: false,
        },
      },
      arr: [{ nested: true }],
    };

    it('应该检测存在的属性', () => {
      expect(ReflectDeep.has(testObj, ['a'])).toBe(true);
      expect(ReflectDeep.has(testObj, ['a', 'b'])).toBe(true);
      expect(ReflectDeep.has(testObj, ['a', 'b', 'c'])).toBe(true);
      expect(ReflectDeep.has(testObj, ['arr', 0, 'nested'])).toBe(true);
    });

    it('应该检测假值属性', () => {
      expect(ReflectDeep.has(testObj, ['a', 'b', 'd'])).toBe(true); // null
      expect(ReflectDeep.has(testObj, ['a', 'b', 'e'])).toBe(true); // undefined
      expect(ReflectDeep.has(testObj, ['a', 'b', 'f'])).toBe(true); // 0
      expect(ReflectDeep.has(testObj, ['a', 'b', 'g'])).toBe(true); // false
    });

    it('应该检测不存在的属性', () => {
      expect(ReflectDeep.has(testObj, ['nonexistent'])).toBe(false);
      expect(ReflectDeep.has(testObj, ['a', 'nonexistent'])).toBe(false);
      expect(ReflectDeep.has(testObj, ['a', 'b', 'nonexistent'])).toBe(false);
      expect(ReflectDeep.has(testObj, ['a', 'b', 'c', 'too', 'deep'])).toBe(false);
    });

    it('应该在路径中遇到基本类型时返回 false', () => {
      expect(ReflectDeep.has(testObj, ['a', 'b', 'c', 'further'])).toBe(false);
    });

    it('应该在参数无效时抛出错误', () => {
      expect(() => ReflectDeep.has(null as any, ['a'])).toThrow(TypeError);
      expect(() => ReflectDeep.has(testObj, [])).toThrow(TypeError);
    });
  });

  describe('reach() 路径遍历测试', () => {
    const testObj = {
      a: {
        b: {
          c: 'target',
          d: 'string',
        },
      },
    };

    it('应该到达完整路径', () => {
      const result = ReflectDeep.reach(testObj, ['a', 'b', 'c']);
      expect(result.value).toBe('target');
      expect(result.index).toBe(2);
      expect(result.reached).toBe(true); // 成功到达最后的值
    });

    it('应该返回最远可达的值', () => {
      const result = ReflectDeep.reach(testObj, ['a', 'b', 'nonexistent']);
      expect(result.value).toEqual({ c: 'target', d: 'string' });
      expect(result.index).toBe(1);
      expect(result.reached).toBe(false); // 未能到达最后的值
    });

    it('应该在遇到基本类型时停止', () => {
      const result = ReflectDeep.reach(testObj, ['a', 'b', 'd', 'further']);
      expect(result.value).toBe('string');
      expect(result.index).toBe(2);
      expect(result.reached).toBe(false); // 在基本类型处停止，未到达最后
    });

    it('应该在第一级就失败时返回 index -1', () => {
      const result = ReflectDeep.reach(testObj, ['nonexistent', 'path']);
      expect(result.value).toBe(testObj);
      expect(result.index).toBe(-1);
      expect(result.reached).toBe(false); // 第一级就失败，未到达
    });

    it('应该正确标记单层路径的到达状态', () => {
      const result = ReflectDeep.reach(testObj, ['a']);
      expect(result.value).toEqual({ b: { c: 'target', d: 'string' } });
      expect(result.index).toBe(0);
      expect(result.reached).toBe(true); // 单层路径成功到达
    });

    it('应该正确处理空路径的边界情况', () => {
      // 注意：这个测试应该抛出错误，因为 expectArgs 会检查空数组
      expect(() => ReflectDeep.reach(testObj, [])).toThrow(TypeError);
    });

    it('应该区分到达目标值和中途停止的情况', () => {
      // 成功到达存在的值
      const successResult = ReflectDeep.reach(testObj, ['a', 'b']);
      expect(successResult.reached).toBe(true);
      expect(successResult.index).toBe(1);

      // 中途因属性不存在而停止
      const failResult = ReflectDeep.reach(testObj, ['a', 'b', 'x', 'y']);
      expect(failResult.reached).toBe(false);
      expect(failResult.index).toBe(1); // 停在 'b' 这一级

      // 遇到基本类型而停止
      const primitiveResult = ReflectDeep.reach(testObj, ['a', 'b', 'c', 'charAt']);
      expect(primitiveResult.reached).toBe(false);
      expect(primitiveResult.index).toBe(2); // 停在 'c' 这一级（字符串是基本类型）
    });

    it('应该在参数无效时抛出错误', () => {
      expect(() => ReflectDeep.reach(null as any, ['a'])).toThrow(TypeError);
      expect(() => ReflectDeep.reach(testObj, [])).toThrow(TypeError);
    });
  });

  describe('keys() 获取所有键测试', () => {
    it('应该获取对象自身的所有键', () => {
      const sym = Symbol('test');
      const obj = { a: 1, b: 2, [sym]: 'symbol' };
      const keys = ReflectDeep.ownKeys(obj);

      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain(sym);
    });

    it('应该获取原型链上的所有键', () => {
      function Parent(this: any) {}
      Parent.prototype.parentProp = 'parent';
      Parent.prototype.sharedProp = 'fromParent';

      function Child(this: any) {
        this.ownProp = 'child';
        this.sharedProp = 'fromChild'; // 覆盖父类属性
      }
      Child.prototype = Object.create(Parent.prototype);
      Child.prototype.childProp = 'child';

      const obj = new (Child as any)();
      const keys = ReflectDeep.ownKeys(obj);

      expect(keys).toContain('ownProp');
      expect(keys).toContain('childProp');
      expect(keys).toContain('parentProp');
      expect(keys).toContain('sharedProp');
      expect(keys).toContain('constructor');
    });

    it('应该处理数组对象', () => {
      const arr = [1, 2, 3];
      const keys = ReflectDeep.ownKeys(arr);

      expect(keys).toContain('0');
      expect(keys).toContain('1');
      expect(keys).toContain('2');
      expect(keys).toContain('length');
      // 数组原型上的方法
      expect(keys).toContain('push');
      expect(keys).toContain('pop');
      expect(keys).toContain('forEach');
    });

    it('应该处理空对象', () => {
      const obj = {};
      const keys = ReflectDeep.ownKeys(obj);

      // 空对象应该包含 Object.prototype 上的方法
      expect(keys).toContain('toString');
      expect(keys).toContain('valueOf');
      expect(keys).toContain('hasOwnProperty');
      expect(keys).toContain('constructor');
    });

    it('应该处理带有不可枚举属性的对象', () => {
      const obj = { visible: 'yes' };
      Object.defineProperty(obj, 'hidden', {
        value: 'secret',
        enumerable: false,
        writable: true,
        configurable: true,
      });

      const keys = ReflectDeep.ownKeys(obj);

      expect(keys).toContain('visible');
      expect(keys).toContain('hidden'); // keys() 应该包含不可枚举属性
    });

    it('应该在参数无效时抛出错误', () => {
      expect(() => ReflectDeep.ownKeys(null as any)).toThrow(TypeError);
      expect(() => ReflectDeep.ownKeys(undefined as any)).toThrow(TypeError);
      expect(() => ReflectDeep.ownKeys('string' as any)).toThrow(TypeError);
      expect(() => ReflectDeep.ownKeys(123 as any)).toThrow(TypeError);
    });
  });

  describe('groupedKeys() 获取分层键测试', () => {
    it('应该返回分层的键信息', () => {
      const obj = { own: 'property' };
      const result = ReflectDeep.groupedKeys(obj);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(1); // 至少包含对象本身和 Object.prototype

      // 第一层应该是对象自身
      expect(result[0].object).toBe(obj);
      expect(result[0].keys).toContain('own');

      // 最后一层应该是 Object.prototype
      const lastLayer = result[result.length - 1];
      expect(lastLayer.keys).toContain('toString');
      expect(lastLayer.keys).toContain('valueOf');
    });

    it('应该正确处理原型链层次', () => {
      function GrandParent(this: any) {}
      GrandParent.prototype.grandProp = 'grand';

      function Parent(this: any) {}
      Parent.prototype = Object.create(GrandParent.prototype);
      Parent.prototype.parentProp = 'parent';

      function Child(this: any) {
        this.ownProp = 'child';
      }
      Child.prototype = Object.create(Parent.prototype);
      Child.prototype.childProp = 'child';

      const obj = new (Child as any)();
      const result = ReflectDeep.groupedKeys(obj);

      // 应该有多个层级
      expect(result.length).toBeGreaterThanOrEqual(4);

      // 第一层：对象自身
      expect(result[0].object).toBe(obj);
      expect(result[0].keys).toContain('ownProp');

      // 找到包含各种属性的层级
      const allKeys = result.flatMap((layer) => layer.keys);
      expect(allKeys).toContain('ownProp');
      expect(allKeys).toContain('childProp');
      expect(allKeys).toContain('parentProp');
      expect(allKeys).toContain('grandProp');
    });

    it('应该包含每层的目标对象引用', () => {
      function Parent(this: any) {}
      Parent.prototype.parentMethod = function () {};

      function Child(this: any) {
        this.childProp = 'value';
      }
      Child.prototype = Object.create(Parent.prototype);

      const obj = new (Child as any)();
      const result = ReflectDeep.groupedKeys(obj);

      // 验证每一层都有正确的 target 引用
      expect(result[0].object).toBe(obj);
      expect(result[1].object).toBe(Child.prototype);
      expect(result[2].object).toBe(Parent.prototype);

      // 验证每一层的 keys 数组包含相应的属性
      expect(result[0].keys).toContain('childProp');
      expect(result[2].keys).toContain('parentMethod');
    });

    it('应该处理数组的原型链', () => {
      const arr = [1, 2, 3];
      const result = ReflectDeep.groupedKeys(arr);

      // 第一层是数组自身
      expect(result[0].object).toBe(arr);
      expect(result[0].keys).toContain('0');
      expect(result[0].keys).toContain('1');
      expect(result[0].keys).toContain('2');
      expect(result[0].keys).toContain('length');

      // 应该包含 Array.prototype 层
      const arrayProtoLayer = result.find((layer) => layer.keys.includes('push') && layer.keys.includes('pop'));
      expect(arrayProtoLayer).toBeDefined();
    });

    it('应该处理具有 Symbol 键的对象', () => {
      const sym1 = Symbol('test1');
      const sym2 = Symbol('test2');

      const obj = { [sym1]: 'value1' };

      // 在原型上添加 Symbol 属性
      const proto = { [sym2]: 'value2' };
      Object.setPrototypeOf(obj, proto);

      const result = ReflectDeep.groupedKeys(obj);

      // 第一层应该包含 sym1
      expect(result[0].keys.some((k) => typeof k === 'symbol')).toBe(true);

      // 第二层应该包含 sym2
      expect(result[1].keys.some((k) => typeof k === 'symbol')).toBe(true);
    });

    it('应该在参数无效时抛出错误', () => {
      expect(() => ReflectDeep.groupedKeys(null as any)).toThrow(TypeError);
      expect(() => ReflectDeep.groupedKeys(undefined as any)).toThrow(TypeError);
      expect(() => ReflectDeep.groupedKeys('string' as any)).toThrow(TypeError);
      expect(() => ReflectDeep.groupedKeys(42 as any)).toThrow(TypeError);
    });

    it('应该正确处理空对象的原型链', () => {
      const obj = {};
      const result = ReflectDeep.groupedKeys(obj);

      expect(result.length).toBeGreaterThanOrEqual(2);

      // 第一层是空对象
      expect(result[0].object).toBe(obj);
      expect(result[0].keys.length).toBe(0);

      // 应该包含 Object.prototype
      const objectProtoLayer = result.find(
        (layer) => layer.keys.includes('toString') && layer.keys.includes('valueOf'),
      );
      expect(objectProtoLayer).toBeDefined();
    });
  });
});
