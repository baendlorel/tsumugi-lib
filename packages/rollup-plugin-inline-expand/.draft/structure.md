# rollup-plugin-inline-expand 结构说明

## 目标

这个子包的目标是把指定函数调用做成“宏展开”：

- 在调用点直接替换函数体/返回表达式；
- 不引入新的函数表达式或 IIFE；
- 参数采用“文本级替换”语义（同一个参数多次出现，会重复展开实参）。

换句话说，它更接近 C/C++ 宏函数，而不是语义保守的 inline optimizer。

## 总体流程

入口在 `src/core/index.ts` 的 `inlineFunction`，每个模块文件执行一次完整流程：

1. **过滤文件**
   - 用 `@rollup/pluginutils` 的 `createFilter` 处理 `include` / `exclude`。
2. **解析 AST**
   - 用 `acorn.parse` 解析成 `Program`。
3. **收集候选函数**
   - 从顶层语句中找 `FunctionDeclaration` 或 `const x = function/arrow`；
   - 名称必须在 `names` 配置中；
   - 同名绑定必须唯一且不可被重新赋值（避免误替换）。
4. **收集调用点**
   - 找到 `CallExpression`，callee 必须是候选函数名；
   - 实参数量必须与形参数量一致；
   - 禁止 `SpreadElement` 实参；
   - 记录替换范围：
     - 普通场景替换调用表达式本身；
     - 若是“块体函数 + 独立表达式语句”，替换整条 `ExpressionStatement`，用于语句级宏展开。
5. **生成替换文本**
   - 建立 `param -> (argument source)` 映射；
   - 在函数展开片段中，按引用位置替换形参为实参源码；
   - 表达式函数返回 `(<expanded>)`；
   - 块体函数返回“原始语句片段”（不包裹函数）。
6. **删除可移除定义**
   - 若一个候选函数的全部引用都属于已识别调用点，则可删除其定义；
   - 当前支持删除：
     - `function foo(...) { ... }`
     - 单声明的 `const foo = (...) => ...` / `const foo = function ...`
7. **应用修改**
   - 使用 `magic-string`，从后往前覆盖调用点与删除区间，输出新代码。

## 模块划分

为避免 `core/index.ts` 过大，核心逻辑已按职责拆分为独立模块：

- `src/core/index.ts`
  - 仅负责插件编排（调用各步骤模块）。
- `src/core/options.ts`
  - 选项归一化（`normalizeOptions`）。
- `src/core/parse.ts`
  - 代码解析（`safeParse`）。
- `src/core/types.ts`
  - 核心共享类型（`FunctionCandidate`、`CallSite`、`SourceRange` 等）。
- `src/core/bindings.ts`
  - 绑定计数与可变绑定检测。
- `src/core/candidates.ts`
  - 候选函数收集与函数体展开根判定。
- `src/core/call-sites.ts`
  - 调用点识别与替换范围定位。
- `src/core/expand.ts`
  - 调用点实参替换与展开字符串生成。
- `src/core/import-candidates.ts`
  - 解析当前文件的 `import`，加载相对路径模块并提取可展开的导出函数。
- `src/core/identifier.ts`
  - 标识符是否为“引用位置”的判定工具。
- `src/core/removals.ts`
  - 可删除函数定义判定、删除区间与区间工具函数。

## 候选函数判定

`toCandidate` 会把函数归类为两种展开根：

- **expression 模式**
  - 箭头表达式体：`const f = (x) => x + 1`
  - 单条 `return expr` 的块体：`function f(x){ return x + 1 }`
- **block 模式**
  - 其余块体函数：展开根为 `{ ... }` 内部语句区间

额外约束：

- 不支持 `async` / `generator`；
- 形参必须都是简单 `Identifier`，不支持解构、默认值、rest 形参（这是为了保证宏替换的确定性）。

## 宏替换语义

当前实现是“源码切片 + 位置替换”：

- 不做值语义分析，不做作用域重写；
- 同一形参出现 N 次，实参源码会插入 N 次；
- 每个实参会加一层括号，降低运算符优先级问题；
- 这会保留宏风格特性，也会带来宏风格风险（例如副作用实参多次求值）。

## 跨文件导入展开

当前支持“相对路径导入函数”的直接展开（单跳）：

- 支持从 `import { x } from './utils'` 和 `import y from './utils'` 收集候选；
- 仅处理 `./`、`../` 或绝对路径导入，不处理包名导入（如 `lodash`）；
- 仅处理导入模块中可静态识别的函数导出（`export function` / `export const fn = ...` / 本地再导出）；
- 不做深层递归 re-export 追踪（例如 A re-export B，B 再 re-export C）；
- 导入函数的“定义删除”不会在当前文件执行（只删除当前文件本地定义）。

## 关键数据结构

- `FunctionCandidate`
  - 候选函数的名称、形参、展开区间、参数引用位置、定义区间。
- `CallSite`
  - 调用点名称、原始区间、实际替换区间、替换类型（expression / statement）、实参区间。
- `SourceRange`
  - 通用源码区间（用于删除函数定义）。

## 设计取舍

- **优先宏行为**：允许块体函数原样贴入调用点；
- **不生成包装器**：避免额外函数层和运行时开销；
- **基本安全阈值**：只保留“唯一绑定 + 未重赋值”的约束，减少明显误替换；
- **可维护性**：AST 使用 `acorn` 官方类型，避免 `any` 扩散。

## 已知限制（当前版本）

- 跨文件仅支持“当前文件 -> 直接相对导入模块”的单跳收集，不做深层依赖图传播；
- 块体函数如果被当作“表达式上下文”调用，展开后可能生成语法错误（这是宏模式的预期风险）；
- 不做变量重命名与捕获规避；
- 不支持复杂形参模式（解构、默认值、rest）。

如果后续需要，可以在此基础上增加“保守模式/激进模式”开关。
