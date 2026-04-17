# rollup-plugin-typescript-privatify 结构设计

## 目标定位

这个包不是“直接操作 Rollup 生命周期的插件”，而是 `@rollup/plugin-typescript` 的 transformer 配置生成器。

最终对外暴露：

- `typescriptPrivatify(options)` -> 返回 `{ before: [transformer] }`
- 使用方把它传给 `typescript({ transformers })`

## 需求拆解

核心需求是把 TypeScript 的 `private`（仅编译期约束）转为运行时私有语义，提供两种模式：

1. `hash` 模式：改成 ECMAScript 私有字段（`#x`）
2. `weakmap` 模式：生成伴生类 + `WeakMap` 存储私有状态，并在调用时 `call(this, ...)`

两个模式共用很多“类成员识别/访问改写”能力，因此按“调度层 + 模式层 + 公共工具层”拆分。

## 模块划分

### 1) 类型层（集中管理）

- `src/types/global.d.ts`
  - 对外类型：`PrivatifyMode`、`RollupTypescriptPrivatifyOptions`、`TypescriptPrivatifyTransformers`
  - 内部共享类型：`ClassLikeNode`、`PrivateNameSets`、`CompanionMember`

这样可以避免类型散落在实现文件里，后续扩展 option 或增加模式时改动集中。

### 2) 入口层（轻量）

- `src/index.ts`
  - 只做两件事：导出类型 + 组装 `{ before: [...] }`
  - 真正的 AST 逻辑不放这里，避免入口文件过厚
  - 附加 rollup 误用保护：给 `name/transform/...` 这类 rollup 属性设置 getter，若被直接当作 rollup 插件读取时立刻抛错并提示正确用法

### 3) 调度层（决定走哪种模式）

- `src/core/transformer.ts`
  - `createPrivatifyTransformer(options)`
  - `normalizeMode(mode)`
  - 访问到类节点后：
    - `hash` -> `transformClassToHash`
    - `weakmap` + class declaration -> `transformClassToWeakMap`
    - class expression（如 `const A = class {}`）直接忽略
    - 匿名 class declaration（如 `export default class {}`）允许处理；`weakmap` 模式下会回退到 `hash`

### 3.5) 声明处理层（可选）

- `hidePrivateDeclarations: true` 时，会挂载 `afterDeclarations` transformer
- 目标：在 TypeScript 声明 AST 阶段删除类中的 `private` 成员声明
- 注意：如果最终 `.d.ts` 由其他工具链阶段处理（如 `rollup-plugin-dts`），该选项不会影响那个阶段
- 对 `rollup-plugin-dts` 场景，额外提供 `hidePrivateDeclarationsForDts()`（Rollup 插件）直接处理 `.d.ts` 代码文本对应的 AST，可放在 `dts()` 前后

### 4) 公共工具层（类结构与修饰符处理）

- `src/core/class-utils.ts`
  - private 成员收集：`collectPrivateNames`
  - companion 成员提取：`collectCompanionMembers`
  - 类节点更新：`updateClassNode`
  - 修饰符过滤：`filterModifiers`
  - 判断函数：`isConvertiblePrivateMember` / `isMovedToCompanion` / `hasModifier` / `hasExtendsClause` 等

这些函数对两种模式都复用，拆出来后可显著降低模式文件复杂度。

### 5) hash 模式层

- `src/core/hash.ts`
  - `transformClassToHash`：整体流程
  - `rewriteHashReferences`：把 `this.x` 改成 `this.#x`
  - `renamePrivateMemberToHash`：把 `private x` 成员名改为 `#x` 并去掉访问修饰符
  - 新增重名规避：如果类里已有 `#x`，则把转换目标改为 `#x_1`、`#x_2`...，并同步改写引用

### 6) weakmap 模式层

- `src/core/weakmap.ts`
  - `transformClassToWeakMap`：主流程
  - 生成：
    - `class A__private`
    - `const __A_private = new WeakMap()`
    - constructor 注入 `__A_private.set(this, new A__private())`
  - 改写：
    - `this.x` -> `__A_private.get(this)!.x`
    - `this.m(...)` -> `__A_private.get(this)!.m.call(this, ...)`
  - 处理继承构造器插入点：确保在 `super()` 后初始化 weakmap

## 转换策略要点

1. **先识别 private 成员集合，再做引用改写**
   - 避免误替换同名非 private 属性

2. **只改写 `this.xxx` 访问**
   - 不碰外部对象访问，降低误伤面

3. **遇到嵌套 class 不深入**
   - 避免把外层 private 规则污染到内层 class 作用域

4. **weakmap 模式把实例 private 抽离，static private 保留 hash 语义**
   - static 走 hash 更自然，实例走 weakmap 满足封装目标

## 为什么这样拆

- `index.ts` 变薄：入口易读、职责单一
- 模式隔离：`hash` 与 `weakmap` 互不干扰，便于独立迭代
- 公共逻辑复用：避免两套逻辑各自复制判断代码
- 类型集中：新增选项、扩展模式时修改面可控
