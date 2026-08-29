# PathMap 审查问题清单

范围：src/index.ts src/core.ts src/value.ts package.json README.md
基于：2026-08-29 版（`VK in` 方案）

────────────────────────────────────────────
## 可改进

### 1. `has()` 最后一行还用的 `instanceof`，跟 `get()` 风格不一致
- 位置：index.ts `has()` 最后一行
- 代码：`return cur instanceof Value;`
- `get()` 对应的行已改为 `VK in cur`，`has()` 没改
- 这个分支的语义：循环完整走完但没 return，说明每个 key 都找到了，且最后一个 key 指向的是 Map（中间节点）。所以返回 false，逻辑正确。
- 但风格不统一，且你 benchmark 说 `instanceof` 慢很多，建议改为 `return false;` 即可——这行不需要再判断了，走到这里 `cur` 一定是 DeepMap。

### 2. `forEach` 回调第三个参数类型承诺与运行时不一致（老问题）
- 位置：index.ts `forEach()` 的类型签名
- 签名：`(value: V, keys: K, map: PathMap<K, V>) => void`
- 实际：`iterate()` 里 `callbackfn.call(thisArg, value[VK], nextKey, map)` 中的 `map` 是内部 `Map`，不是 `PathMap` 实例
- 影响极小，但类型声明是骗人的

### 3. `entries()` / `keys()` / `values()` 返回数组，不是懒迭代器
- 不影响正确性，但你之前问过性能问题，记录在此
- `keys()` 和 `values()` 在 `entries()` 全量数组基础上又 map 一次，多了一次遍历

### 4. `assertKeys` 的 `asserts keys is any[]` 类型空转
- 位置：core.ts `assertKeys`
- 代码：`function assertKeys(keys: unknown): asserts keys is any[]`
- 参数类型是 `unknown`，assertion 说"检查后 keys 是 any[]"，但实际只保证非空数组，`any[]` 不包含"非空"信息
- 改成 `: void` 更诚实，反正调用处已经约束了泛型 `K extends any[]`

### 5. `package.json` 缺少 `"sideEffects": false`
- 所有函数式导出的纯数据类库建议加这个，方便 tree-shaking

### 6. `README` 没跟上最新 API
- 构造器签名：`new PathMap<K, V, NullType>(entries?, nullValue?)`，README 只写了 `new PathMap<K extends any[], V>()`
- `get()` 返回类型：`V | NullType`，README 写的是 `V | undefined`
- 没提及 `PathMap.Null` 常量的用途
- `forEach` 回调第三个参数 map 的类型没写

────────────────────────────────────────────
## 没问题（确认过的设计决策）

- ✅ `!next || VK in next`：`next` 只可能是 `undefined` / `Value` / `Map` 三种，完全覆盖
- ✅ `VK in` 替代 `instanceof`：性能更好
- ✅ `set` 中遇到 Value 就覆盖为 Map：行为合理，中间路径被新 set 覆盖
- ✅ `DeepMap` 类型：`Map<any, Value<any> | DeepMap>` 准确描述了内部结构
- ✅ `Value<T>` 用 Symbol key `[VK]` 存值：外部无法直接访问，封装性好
- ✅ `clear` / `iterate` / `entries` 在 core.ts 中已改用 `VK in`
- ✅ 没有 `WeakSet<Map>` 了，逻辑更干净
- ✅ `tsc --noEmit` 零报错

────────────────────────────────────────────
## 总结

共 6 条可改进：
- 1 条风格不一致（`has` 最后一行）
- 2 条类型不精确（`forEach` 回调、`assertKeys`）
- 1 条性能/设计取舍（entries 非懒）
- 1 条配置优化（sideEffects）
- 1 条文档滞后（README）
