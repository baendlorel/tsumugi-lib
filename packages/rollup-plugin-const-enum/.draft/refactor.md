# rollup-plugin-const-enum 重构方案

## 1. 背景与重构目标

当前实现的核心路径是：

1. 递归扫描文件。
2. 用正则提取 `const enum` 声明。
3. 在 `transform` 里用正则把 `Enum.Member` 文本替换成字面量。

这条路径的根本问题不是“覆盖面不够”，而是“控制精度不够”：

- 只能按文本匹配，无法做符号级判定。
- 无法可靠区分真正的枚举成员访问与同名普通属性访问。
- 无法自然支持“只内联某些 enum 名字”的筛选。
- 无法安全扩展到普通 `enum` 的可选内联。

本次重构的目标是把插件改成“基于 TypeScript AST + TypeChecker 的精确内联器”，让它的职责明确为：

> 利用 TypeScript 的语法树和类型系统，将 `const enum` 成员访问精确内联到调用位置；当启用特定选项时，也允许内联普通 `enum` 的常量成员。

## 2. 目标行为定义

### 2.1 默认行为

- 默认只内联 `const enum`。
- 默认不限制名字，即所有命中的 `const enum` 都允许内联。
- 默认只处理能被 TypeScript 判定为常量值的枚举成员访问。
- 对无法安全求值的访问保持原样，不做激进替换。

### 2.2 新增选项

```ts
export interface RollupConstEnumOptions {
  suffixes: string[];
  skipDts: boolean;
  files: string[];
  excludedDirectories: string[];
  inlineNonConstEnums: boolean;
  inlineNames?: Array<string | RegExp>;
}
```

新增选项语义如下：

- `inlineNonConstEnums`
  - 类型：`boolean`
  - 默认值：`false`
  - 含义：为 `true` 时，即便目标不是 `const enum`，只要是普通 `enum` 且该成员能被 TypeScript 判定为常量值，也允许内联。

- `inlineNames`
  - 类型：`Array<string | RegExp> | undefined`
  - 默认值：`undefined`
  - 含义：只有名字匹配的枚举才会内联；未提供时表示不过滤。

### 2.3 inlineNames 的匹配规则

建议将匹配目标定义为“枚举名”，而不是成员名：

- `Color.Red` 的匹配目标是 `Color`
- `Ns.Color.Red` 的匹配目标优先使用 `Ns.Color`，同时保留 `Color` 作为兼容候选

匹配策略：

- `string` 按精确匹配处理。
- `RegExp` 按 `test` 处理。
- 只要任一候选名命中任一规则，即允许内联。

这样做的原因是：

- 语义直观，用户配置的是“哪些 enum 可以被内联”。
- 比匹配成员名更稳定，避免把 `Red`、`Active` 这类高重复词暴露为筛选键。

## 3. 核心设计

### 3.1 总体架构

重构后将插件拆成四层：

1. `options`
   - 负责选项归一化与校验。
2. `file-discovery`
   - 负责根据 `files`、`suffixes`、`excludedDirectories`、`skipDts` 收集候选源文件。
3. `ts-context`
   - 负责创建和缓存 `typescript.Program` / `TypeChecker` / `SourceFile` 访问能力。
4. `enum-inliner`
   - 负责基于 AST 查找成员访问、做符号解析、判定是否允许内联、生成替换节点。

现有 `ConstEnumHandler` 的职责会被拆散：

- 文件扫描逻辑可以保留，但要下沉为纯“根文件发现器”。
- 正则解析与替换逻辑整体移除。

### 3.2 建议的源码结构

建议重构为以下文件布局：

```text
src/
  index.ts
  options.ts
  discover-files.ts
  create-ts-context.ts
  inline-enum-access.ts
  match-inline-name.ts
  literal.ts
  types/
    global.ts
```

各文件职责：

- `index.ts`
  - 组装插件实例。
  - 在合适时机初始化 TypeScript 上下文。
  - 在 `transform` 中调用内联器。

- `discover-files.ts`
  - 只做文件发现，不参与 enum 解析。

- `create-ts-context.ts`
  - 创建 `Program` 和 `TypeChecker`。
  - 为当前 `transform` 的 `id + code` 提供内存覆盖，避免只依赖磁盘内容。

- `inline-enum-access.ts`
  - 查找 `PropertyAccessExpression` / `ElementAccessExpression`。
  - 识别目标是否为 enum member access。
  - 判断是否满足 `const enum` / `inlineNonConstEnums` / `inlineNames`。
  - 生成替换后的字面量节点。

- `match-inline-name.ts`
  - 封装 `inlineNames` 的规则匹配，保持主流程清晰。

- `literal.ts`
  - 负责把 `string | number` 常量值转成 TypeScript 字面量节点。

### 3.3 TypeScript 上下文设计

这是本次重构的关键点。

建议插件内部维护一个轻量的 TypeScript 上下文对象：

```ts
interface TsContext {
  program: ts.Program;
  checker: ts.TypeChecker;
  refresh(next?: Map<string, string>): void;
  getSourceFile(fileName: string): ts.SourceFile | undefined;
}
```

设计原则：

- `Program` 的根文件来自文件发现器收集结果。
- 当前正在 `transform` 的文件如果已经在根文件集合中，优先用内存中的 `code` 覆盖磁盘内容。
- 如果 `id` 不在初始根文件列表内，但后缀可识别，也要允许临时纳入上下文。
- 一个构建周期内允许复用 `Program`，但在 `buildStart` 或首次 `transform` 时要有明确的刷新策略。

推荐方案：

- 在 `buildStart` 初始化文件集合和基础 `Program`。
- 在每次 `transform(code, id)` 时，对当前文件建立一次内存覆盖，然后刷新 `Program`。
- 不追求“复杂增量编译器”，优先追求实现可控和语义正确。

原因：

- 这个包的目标是可靠内联，不是充当完整的 TypeScript 构建器。
- 与其过早做复杂缓存，不如先让符号解析和语义稳定下来。

### 3.4 访问表达式识别

只处理明确的枚举成员访问：

- `Color.Red`
- `Status.Active`
- `Ns.Color.Red` 的最终成员访问节点
- `Color['Red']` 可作为第二阶段支持项，首版可只支持字面量字符串索引

不处理或首版暂不处理：

- 动态索引，如 `Color[key]`
- 运行时 reverse mapping 访问
- 与 enum 无关但文本形似的属性访问

判定流程建议如下：

1. 遍历 AST。
2. 发现 `PropertyAccessExpression` 或可静态判定的 `ElementAccessExpression`。
3. 通过 `checker.getSymbolAtLocation(...)` 拿到成员符号。
4. 判断该符号是否来自 `EnumMember`。
5. 取到所属 enum 声明，判断它是 `const enum` 还是普通 `enum`。
6. 应用 `inlineNonConstEnums` 和 `inlineNames` 筛选。
7. 调用 TypeScript 常量求值能力获取该成员常量值。
8. 若成功求值，则用字面量 AST 节点替换。

### 3.5 常量值获取策略

应优先依赖 TypeScript 自身的常量语义，而不是自己再实现一套 enum 求值器。

建议优先使用：

- `checker.getConstantValue(accessNode)`
- 必要时回退到 `checker.getConstantValue(enumMemberDeclaration)`

这样可以直接复用 TypeScript 对以下情况的处理能力：

- 数字枚举自增
- 十六进制数值
- 字符串枚举
- 引用前面成员的常量表达式
- 普通 `enum` 中可静态计算的常量成员

如果 `getConstantValue` 返回 `undefined`，则保持原表达式不变。这是安全边界，不应自行猜测。

### 3.6 AST 变换策略

建议使用 `ts.transform` 或 `ts.visitEachChild` 做纯语法树替换。

输出策略：

- 仅当至少发生一次替换时才返回新的 `code`。
- 未发生替换时返回 `null`。
- sourcemap 第一阶段可先返回 `null`，第二阶段再补 source map 支持。

字面量生成规则：

- `string` -> `factory.createStringLiteral(value)`
- `number` -> `factory.createNumericLiteral(...)`
- 负数建议生成 `PrefixUnaryExpression(-, NumericLiteral(...))`，避免直接拼字符串造成 AST 非法

### 3.7 名字筛选设计

建议把名字筛选单独封装成纯函数：

```ts
function shouldInlineEnumName(
  enumNames: string[],
  inlineNames: Array<string | RegExp> | undefined,
): boolean
```

行为：

- `inlineNames === undefined` 时恒为 `true`
- `string` 规则使用严格相等
- `RegExp` 规则使用 `test`
- `enumNames` 一般包含：
  - 本地声明名，如 `Color`
  - 若可取到限定名，则再加一个如 `Ns.Color`

## 4. 与现有选项的兼容策略

建议保留以下现有选项，因为它们仍然适合作为“Program 根文件发现器”的输入：

- `suffixes`
- `files`
- `excludedDirectories`
- `skipDts`

但需要重新定义它们的定位：

- 旧实现里它们是“供正则扫描使用的文件过滤条件”。
- 新实现里它们是“构造 TypeScript 分析上下文时的候选源文件集合规则”。

这样可以尽量减少 API 破坏，同时避免保留旧逻辑语义。

## 5. Rollup 生命周期建议

建议使用以下生命周期：

- `buildStart`
  - 发现文件
  - 初始化 TypeScript 上下文

- `transform`
  - 对当前模块建立 `SourceFile`
  - 执行 AST 内联
  - 返回替换后的代码

必要时可加：

- `watchChange`
  - 使缓存失效，确保 watch 模式下 Program 刷新

不建议继续沿用“插件初始化时就立刻扫描并固定替换表”的做法，因为那会让 watch 和增量开发的行为不可靠。

## 6. peerDependencies 调整

需要在包的 `package.json` 中新增：

```json
"peerDependencies": {
  "rollup": ">=4.0.0",
  "typescript": ">=4.5.0"
}
```

同时建议保留当前 workspace 根上的开发依赖，用于本包测试与构建。

原因：

- 插件运行时会直接依赖 `rollup` 的类型/接口语义。
- 新实现会直接使用 `typescript` 编译器 API。
- 将它们声明为 peerDependencies，符合 Rollup 插件生态的实际使用方式。

## 7. 测试重构方案

现有测试大量绑定在“正则扫描结果”上，重构后应整体迁移为“语义行为测试”。

建议拆成四组测试：

### 7.1 options 测试

覆盖点：

- `inlineNonConstEnums` 默认值为 `false`
- `inlineNames` 默认值为 `undefined`
- `inlineNames` 支持 `string` 和 `RegExp`
- 非法类型报错

### 7.2 matcher 测试

覆盖点：

- `string` 精确匹配
- `RegExp` 匹配
- `Ns.Color` 与 `Color` 候选名匹配
- `inlineNames === undefined` 时放行全部

### 7.3 transform 单测

直接验证代码变换结果：

- 默认只内联 `const enum`
- 开启 `inlineNonConstEnums` 后可内联普通 `enum`
- `inlineNames` 未命中时不替换
- `inlineNames` 命中时替换
- 普通对象属性访问不被误替换
- 字符串枚举、数字枚举、十六进制枚举、自增成员均能正确处理
- 无法静态求值时保持原样

### 7.4 rollup 集成测试

至少保留一到两个真正通过 Rollup 跑的用例：

- TS 输入经过本插件后成功产出正确 JS
- 插件在 watch/重复构建场景下不会复用脏缓存

## 8. 推荐的实现顺序

建议按下面顺序推进，避免一次性重写过大：

1. 先重写 `options.ts` 与类型定义
2. 抽离文件发现器，保留现有扫描逻辑但去掉 enum 解析职责
3. 建立最小可用的 `Program + TypeChecker` 上下文
4. 先支持 `PropertyAccessExpression` 的 `const enum` 内联
5. 再加 `inlineNonConstEnums`
6. 再加 `inlineNames`
7. 最后补 `ElementAccessExpression`、watch 刷新和集成测试

这样每一步都有明确可验证的边界。

## 9. 风险与边界

### 9.1 与插件顺序相关

该插件仍应放在 TypeScript 转译插件之前执行，否则输入代码可能已经失去原始 TypeScript enum 语义。

### 9.2 与 tsconfig 相关

如果用户项目的路径别名、moduleResolution、jsx 等设置与默认编译选项差异较大，TypeScript 上下文需要尽量从项目配置继承，避免符号解析偏差。

建议实现时优先尝试：

- 从最近的 `tsconfig.json` 读取编译选项
- 读取失败时退回一套最小默认值

### 9.3 普通 enum 的安全边界

即便开启 `inlineNonConstEnums`，也不应承诺“所有普通 enum 用法都能被替换”。

正确语义应是：

- 只内联可被 TypeScript 判定为常量值的 enum member access
- 其余情况保持原样

### 9.4 Source map

source map 可以作为第二阶段工作项。首轮重构先把语义正确性建立起来，再补映射精度更稳妥。

## 10. 预期产出

重构完成后，这个包应具备以下性质：

- 不再依赖正则做 enum 语义解析
- 以内联“真实 enum member access”为准，而不是文本碰撞
- 默认专注 `const enum`
- 通过 `inlineNonConstEnums` 安全扩展到普通 `enum`
- 通过 `inlineNames` 精细限制内联范围
- 通过 `peerDependencies` 明确运行时宿主约束

## 11. 一句话结论

这次不是“在旧实现上补两个选项”，而是把插件从“文本替换器”升级为“基于 TypeScript 语义模型的枚举成员内联器”；文件扫描逻辑最多只保留为 Program 根文件发现器，其余正则解析与替换逻辑都应退场。
