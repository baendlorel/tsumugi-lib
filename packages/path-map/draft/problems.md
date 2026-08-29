# PathMap 源码审查问题清单

审查范围：src/index.ts（2026-08-29 版）
审查基准：只读分析，不做修改

────────────────────────────────────────────

## 严重

### 1. `get()` 中间节点缺失时返回 `nullValue` 而非 `undefined`

- 位置：get() 方法
- 代码：`return i === keys.length - 1 ? (cur as V) : this.nullValue;`
- 描述：当遍历到中间某层 key 不存在（cur === undefined）且 i 不是最后一个索引时，返回 `this.nullValue`。
  但 `this.nullValue` 的默认值是 `undefined`（NullType 默认 = undefined），所以默认情况下行为正确。
  但如果用户构造时传了 `nullValue` 参数，中间路径缺失也会返回这个值，和叶子节点缺失无法区分。
- 例子：`map.set(['a','b','c'], 1)`，然后 `map.get(['a','x'])` → 在 'a' 下找 'x' 没有，返回 `this.nullValue`。
  但 `map.get(['a','b','c'])` 返回 1，`map.get(['a','b','x'])` 也返回 `this.nullValue`，两者一样。
- 建议：路径中间节点缺失和叶子节点缺失是否应该区分？如果 `NullType` 的用途是"路径存在但值为空"，
  那中间节点不存在不应该返回 `nullValue`，而应该返回 `undefined`。

### 2. `assertKeys` 用 `asserts keys is any[]` 是类型误导

- 位置：`function assertKeys(keys: any[]): asserts keys is any[]`
- 描述：这个 assertion 说"如果通过检查，keys 就是 any[] 类型"，但参数类型已经是 `any[]`，
  assertion 没有任何 narrowing 效果，逻辑上是空转。
- 建议：去掉 `asserts` 返回，直接用 `: void`。

────────────────────────────────────────────

## 中等

### 3. `has()` 用 `internalMaps.has(cur)` 判据有边界缺陷

- 位置：has() 方法
- 代码：
  ```
  if (!this.internalMaps.has(cur)) {
    return i === keys.length - 1;
  }
  ```
- 描述：非内部 Map 就认为是叶子值。但如果用户恰好在中间路径存了一个原生 `Map` 实例作为 value，
  `internalMaps.has(cur)` 会返回 false（PathMap 没创建它），has() 会认为路径存在值而返回 true。
  但该路径实际并未被 set 过。
- 建议：加 `cur instanceof Map` 双重判断——如果是 Map 但不是 internal Map，说明是用户存入的 value，
  应该当作叶子处理（返回 true）；但如果是中间节点且不是 Map，该路径不存在。

### 4. `delete()` 同上的 `internalMaps.has` 判据

- 位置：delete() 方法
- 代码：`if (!this.internalMaps.has(next)) { return; }`
- 描述：同 has，如果用户恰好在中间路径存了一个原生 Map 作为 value，delete 会提前 return，
  不会继续遍历到真正的叶子。
- 建议：同 has，用 `!(next instanceof Map) || !this.internalMaps.has(next)` 更安全。

### 5. `forEach` 回调第三个参数类型仍为 `Map` 而非 `PathMap`

- 位置：`iterate` 中 `callbackfn.call(thisArg, value, nextKey, map)`
- 描述：类型签名说 `map: PathMap<K, V>`，但运行时传的是内部 `Map`。
  老问题，仍未修复。

### 6. delete 后不清理空中间节点

- 位置：delete() 方法
- 描述：删除叶子后，如果中间 Map 变空，父 Map 仍然持有该中间 Map 的引用且 internalMaps 仍持有引用，
  导致空内部 Map 无法被 GC。
- 建议：可考虑递归检查并清理，或作为未来优化。

────────────────────────────────────────────

## 低

### 7. README 未反映 `NullType` 和 `PathMap.Null`

- 位置：README.md
- 描述：API 文档仍写 `new PathMap<K, V>()` 和 `.get(keys): V | undefined`，
  但实际代码有第三个泛型参数 `NullType`、构造器的 `nullValue` 参数和 `PathMap.Null` 常量。
- 建议：补充构造器签名、nullValue 参数和 PathMap.Null 的说明。

### 8. README 的 constructor 示例少了 nullValue 参数

- 位置：README.md
- 描述：`new PathMap<string[], number>()` 实际是 `new PathMap<string[], number, NullType>(entries?, nullValue?)`，
  README 示例未体现。
- 建议：更新 README 示例。

────────────────────────────────────────────

## 亮点（好的改动）

- ✅ `assertKeys` 统一拦截空 key 路径，消灭了 get/set/delete/has 的空数组 bug
- ✅ `has()` 方法已实现
- ✅ `[Symbol.toStringTag]` 改成了 getter
- ✅ `NullType` 泛型和 `PathMap.Null` 让用户能区分"路径不存在"和"值就是 undefined"
- ✅ 构造器支持传入初始 entries
- ✅ `delete`/`has` 改用 `internalMaps.has` 而非 `instanceof Map`，更精确
- ✅ package.json 已正确 clean（无 bin、无旧依赖、exports 有 cjs+esm）
- ✅ `[Symbol.iterator]` 改为 generator（惰性求值）
- ✅ `assertKeys` 在 get/has/delete 中统一抛错而非静默失败
- ✅ `set` 禁止空 key 路径并抛 TypeError

────────────────────────────────────────────

## 已修复的上轮问题对照

| 上轮问题                        | 状态                                  |
| ------------------------------- | ------------------------------------- |
| 1. get([]) 返回根 Map           | ✅ 已修（assertKeys 拦截）            |
| 2. set([]) 设 undefined 键      | ✅ 已修（assertKeys 拦截）            |
| 3. delete([]) 删 undefined 键   | ✅ 已修（assertKeys 拦截）            |
| 4. has 对中间节点误判           | ✅ 已修（改用 internalMaps.has）      |
| 5. get 泛型遮蔽                 | ✅ 已修（去掉了方法泛型）             |
| 6. 缺 has 方法                  | ✅ 已修（已实现）                     |
| 7. forEach 回调类型             | ❌ 仍未修                             |
| 8. Symbol.toStringTag 非 getter | ✅ 已修                               |
| 9. 拼写 interalMaps             | ❌ 未修但已不重要（用户自定义函数名） |
| 10. 缺 size                     | ❌ 仍未修                             |
| 11. 不清理空节点                | ❌ 仍未修（同新问题 6）               |
