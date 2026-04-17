# 条件编译 `if` 判定流程图

下面用两张 Mermaid 图说明：

1. 现在代码里的实际流程（`parser.ts` 现状）
2. 更符合直觉的“有记忆短路”流程（建议模型）

---

## 1) 当前实现流程（现状）

```mermaid
flowchart TD
  A[proceed→code] --> B[toDirvBlocks→code]
  B --> C[acorn.parse + onComment扫描行注释]
  C --> D{是 #if/#elif/#else/#endif 吗}
  D -- 否 --> C
  D -- 是 --> E{指令类型}

  E -- #if 或 #elif --> F[evaluate→expr 立即求值]
  E -- #else --> G[condition = true]
  E -- #endif --> H[condition = false]

  F --> I[生成 DirvBlock]
  G --> I
  H --> I
  I --> C

  C --> J[toIfBlocks→dirvBlocks]
  J --> K[用栈重建 IfBlock 树 + 语法检查]
  K --> L[compile→code, ifBlocks]
  L --> M[遍历 IfBlock 生成 keep ranges]
  M --> N[拼接 result.code + keptRanges]
  N --> O[createSourceMap]
```

### 这个流程的关键特点

- `#if/#elif` 在 **收集注释阶段** 就会 `evaluate`。
- 所以某个 `#elif` 即便在逻辑上已不可达，也可能被提前求值。
- 这就是你说的“看起来无记忆”的来源：
  - 收集阶段没有 `branchTaken`（该链是否已命中）这个状态。

---

## 2) 建议的“有记忆短路”流程（状态机）

核心状态：

- `parentActive`: 父层是否可达
- `branchTaken`: 当前 `if/elif/else` 链是否已有命中分支
- `inElse`: 是否已经进入过 `#else`

```mermaid
flowchart TD
  S[进入一条 if-chain] --> I1[#if expr]

  I1 --> C1{parentActive && !branchTaken ?}
  C1 -- 否 --> I2[active = false; 不求值 expr]
  C1 -- 是 --> I3[cond = evaluate expr ]
  I3 --> I4{cond}
  I4 -- true --> I5[active = true; branchTaken = true]
  I4 -- false --> I6[active = false]

  I2 --> E1{下一个指令}
  I5 --> E1
  I6 --> E1

  E1 -- #elif expr --> L1{inElse ?}
  L1 -- 是 --> ERR1[语法错误: #else 后不能再 #elif]
  L1 -- 否 --> L2{parentActive && !branchTaken ?}
  L2 -- 否 --> L3[active = false; 跳过求值]
  L2 -- 是 --> L4[cond = evaluate expr ]
  L4 --> L5{cond}
  L5 -- true --> L6[active = true; branchTaken = true]
  L5 -- false --> L7[active = false]
  L3 --> E1
  L6 --> E1
  L7 --> E1

  E1 -- #else --> O1{inElse ?}
  O1 -- 是 --> ERR2[语法错误: 重复 #else]
  O1 -- 否 --> O2[active = parentActive && !branchTaken]
  O2 --> O3[branchTaken = true; inElse = true]
  O3 --> E1

  E1 -- #endif --> END[结束当前 if-chain]
```

---

## 3) 一个最小例子（帮助理解“短路记忆”）

```js
// #if true
keepA();
// #elif UNKNOWN_VAR
keepB();
// #else
keepC();
// #endif
```

在“有记忆短路”模型里：

- `#if true` 命中后，`branchTaken = true`
- 后续 `#elif UNKNOWN_VAR` **不会求值**（直接跳过）
- `#else` 也不会激活
- 最终只保留 `keepA()`

---

## 4) 一句话总结

- 你现在的实现是“先求值、后建树”，因此在 `elif` 上看起来“无记忆”。
- 若改成“状态机驱动求值”，就会变成“按链短路、有记忆”的判定流程。
