# rollup-plugin-conditional-compilation 条件编译方法复核笔记

## 0. 先说结论

你原来的判断大方向是对的，尤其这三点：

1. sourcemap 的实现存在明显性能热点。
2. `new Function` 的安全边界过宽。
3. 可以借鉴 C/C++ 预处理器的“状态机 + 短路”思想，但不能照搬其模型。

我补充/修正的重点是：

- 当前最值得优先处理的不只是性能，还有一个“语义正确性”问题：`#elif` 在逻辑上不应总是被求值。
- “注释正则预筛选”不是主瓶颈，真正的重开销更可能是“为了拿注释而构建整棵 AST”。
- 之前测试中把 `CompileResult` 当字符串用的问题已经修复，现在应继续按 `result.code` 语义统一。

---

## 1. 当前实现方法（基于现代码）

主流程（`src/compiler/parser.ts` + `src/compiler/sourcemap.ts`）：

1. `toDirvBlocks(code)`
   - 用 `acorn.parse(..., { onComment })` 扫描行注释，提取 `#if/#elif/#else/#endif`。
   - 在这一步就对 `#if/#elif` 执行表达式求值（`evaluate`）。
2. `toIfBlocks(dirvBlocks)`
   - 栈式重建嵌套结构并做语法检查。
3. `compile(code, ifBlocks)`
   - 递归遍历 IfBlock，生成保留区间并拼接输出 `code`。
4. `createSourceMap(code, keptRanges)`
   - 重新计算行列映射并输出 sourcemap。

这个设计优点仍然成立：可读、可测、行为直观。

---

## 2. 需要修正/增强的判断

## 2.1 语义正确性优先级应上调（P0）

### 问题

当前在 `toDirvBlocks` 阶段就会求值所有 `#elif` 表达式。即便前面分支已经命中，该 `#elif` 依然会被执行。

这会带来两个问题：

- **语义偏差**：按 if/else-if 直觉，后续 `#elif` 应短路。
- **稳定性风险**：不可达分支里出现未定义变量/副作用表达式时，仍可能抛错或产生副作用。

### 建议

把“求值时机”后移到状态机阶段：

- 先提取指令 + 原始表达式（不立即 evaluate）。
- 在处理 `if/elif/else` 链时按父层 active 状态和“链是否已命中”决定是否求值。

这是“正确性 + 性能”双收益，建议放在 P0。

---

## 2.2 sourcemap 热点判断正确，但可再补一条“精度风险”（P0）

你写的 `O(n^2)` 判断是成立的：

- `build()` 中按字符循环；
- 每个字符又调用 `getLineColumn(code, offset)` 从头扫描。

此外还有一个精度层面的潜在问题：

- 当前只在 `generatedColumn === 0` 时记录映射点，属于低密度映射；
- 当保留片段在同一生成行内拼接时，调试定位可能不够细。

### 建议路线

1. **最实用**：改为 `magic-string`（维护成本最低，map 更稳）。
2. 不引依赖时：
   - 预构建 `lineStarts`（换行起始索引数组）；
   - 偏移到行列用二分或增量指针；
   - 避免每字符回扫。

---

## 2.3 “directive 预筛选”是小优化，真正大头是“整 AST 构建”（P1）

你提的“首字符预筛选再走 regex”没问题，但收益通常不大。

更值得关注的是：当前为了拿注释调用 `acorn.parse`，会构建完整 AST；而插件其实只需要注释流。

### 建议

评估用 `acorn.tokenizer`（仅词法扫描）+ `onComment`：

- 可能明显降低内存和 CPU；
- 代价是要确认注释回调行为与 parse 路径一致。

这比单纯 regex 微调更可能拿到可感知收益。

---

## 2.4 `new Function` 安全问题判断成立，但应分“安全目标”讨论（P2）

当前行为允许几乎任意 JS 表达式，这是产品特性之一（README 也明确了）。

因此“替换为受限求值器”要先定策略：

- 若目标是“最大兼容”，保留 `new Function`，仅补文档和测试约束；
- 若目标是“安全优先”，就要接受语法子集收缩（布尔/比较/逻辑/算术/括号等）。

也就是说，这不是纯技术优化，而是产品策略变更。

---

## 3. 比你原稿更可落地的优化顺序

## P0（建议先做）

1. **短路求值语义改造**（先修正确性，再谈速度）。
2. **sourcemap 复杂度优化**（`magic-string` 或 lineStarts + 增量法）。
3. 增补对应回归测试（见第 5 节）。

## P1（随后）

1. 将注释收集从 `parse` 评估迁移到 `tokenizer`（做 A/B benchmark 再决定）。
2. 表达式编译缓存（`expr -> compiled fn`）。
3. 轻量 directive 词法器替代正则（可选）。

## P2（按安全目标）

1. 设计受限表达式语法并替换 `new Function`。
2. 写清向后兼容策略与迁移说明。

---

## 4. 推荐的“状态机”模型（用于替代 eager evaluate）

对每层 if-chain 维护一个 frame：

- `parentActive`: 父层是否可达。
- `branchTaken`: 当前 if/elif/else 链是否已命中。
- `inElse`: 是否已经进入 `#else`。
- `active`: 当前分支是否生效。

伪流程：

```text
#if expr:
  canEval = parentActive && !branchTaken
  cond = canEval ? eval(expr) : false
  active = cond
  branchTaken = cond

#elif expr:
  if inElse => syntax error
  canEval = parentActive && !branchTaken
  cond = canEval ? eval(expr) : false
  active = cond
  branchTaken ||= cond

#else:
  if inElse => syntax error
  active = parentActive && !branchTaken
  branchTaken = true
  inElse = true

#endif:
  pop frame
```

这个模型可以自然实现：

- 短路求值；
- 不可达分支跳过 evaluate；
- 语法检查与可达性判断同一遍完成。

---

## 5. 建议新增的测试（避免“优化后退化”）

1. **短路正确性**
   - `#if true` 后接 `#elif UNKNOWN_VAR` 不应抛错。
2. **父分支不可达**
   - 外层 false 时，内层 `#if sideEffect()` 不应执行。
3. **sourcemap 回归**
   - 删除前后行号断言（至少覆盖多段拼接、嵌套删除）。
4. **性能基准**
   - 大文件（1e4+ 行）+ 深嵌套 + 长 elif 链，对比改造前后耗时。

---

## 6. 对原笔记条目的快速复核

- 表达式缓存：有道理，保留。
- directive 预筛选：有道理，但优先级可下调。
- `toIfBlocks/compile` 中间对象减量：可做，但在“短路语义 + sourcemap”之后。
- sourcemap O(n^2)：判断准确，且应提升到最高优先级之一。
- C++ 思路借鉴：判断准确，建议落到“状态机实现”而不是概念层。

---

## 7. 总结

当前实现已经“能用 + 结构清晰”，但下一步最值得做的是：

1. 先修正 `#elif` 求值时机（语义正确性）。
2. 再优化 sourcemap（性能与调试体验）。
3. 最后做 tokenizer/缓存等工程化提速。

这样改动收益最大，风险也可控。
