import { describe, it, expect } from 'vitest';
import { ReflectDeep } from '../src/index.js';

describe('构造函数测试', () => {
  it('应该在尝试实例化时抛出错误', () => {
    expect(() => Reflect.construct(ReflectDeep as any, [])).toThrow(TypeError);
  });
});

describe('边界情况和刁钻测试', () => {
  it('应该处理超长路径', () => {
    const obj = {};
    const longPath = Array.from({ length: 100 }, (_, i) => `level${i}`);

    expect(ReflectDeep.set(obj, longPath, 'deep')).toBe(true);
    expect(ReflectDeep.get(obj, longPath)).toBe('deep');
    expect(ReflectDeep.has(obj, longPath)).toBe(true);

    const result = ReflectDeep.reach(obj, longPath);
    expect(result.value).toBe('deep');
    expect(result.index).toBe(99);
  });
});
