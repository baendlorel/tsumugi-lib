# ES6+ API和语法特性分析

## 扫描结果

扫描目录：`src/`
扫描文件数：9个TypeScript文件

## ES6 (ECMAScript 2015) 特性

### 1. 箭头函数 (Arrow Functions)
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 4.0.0
- **使用位置**: 多个文件中使用
- **示例**: `const add = (node: FunctionNode, name: string) => funcs.push({...})`
- **文件**: `src/core/find-name.ts:27`, `src/core/replace.ts:40,80,83,90`

### 2. 模板字符串 (Template Literals)
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 4.0.0
- **使用位置**: 注释和代码中使用
- **示例**: `console.warn(`__NAME__: Warning: using a very short identifier('${identifier}')...`)`
- **文件**: `src/core/normalize.ts:42-44,48-50`

### 3. 解构赋值 (Destructuring Assignment)
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 6.0.0
- **使用位置**: 函数参数和变量声明
- **示例**: `const { code, identifier, nameGetter, fallback, stringReplace } = opts;`
- **文件**: `src/core/replace.ts:73,81`

### 4. const/let声明
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 6.0.0
- **使用位置**: 替代var，所有变量声明
- **示例**: `const funcs: FunctionContext[] = [];`
- **文件**: `src/core/find-name.ts:26`, 所有文件中的变量声明

### 5. 默认参数 (Default Parameters)
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 6.0.0
- **使用位置**: 函数参数默认值
- **示例**: `export function funcMacro(options?: Partial<FuncMacroOptions>): Plugin`
- **文件**: `src/func.ts:16`

### 6. 模块导入/导出 (ES6 Modules)
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 12.0.0 (稳定支持)
- **使用位置**: 所有文件
- **示例**: `import { parse, Node as AcornNode, ... } from 'acorn';`
- **文件**: 所有文件开头

### 7. 增强的对象字面量 (Enhanced Object Literals)
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 4.0.0
- **使用位置**: 对象属性简写
- **示例**: `{ start, end, replacement, type }`
- **文件**: `src/core/replace.ts:81`

## ES6 (ECMAScript 2015) API

### 1. Array.prototype.findIndex()
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 4.0.0
- **使用位置**: 数组查找
- **示例**: `const index = filtered.findIndex((f) => f.end === func.end);`
- **文件**: `src/core/find-name.ts:92`

### 2. Array.prototype.some()
- **ES版本**: ES5 (但广泛使用于ES6代码中)
- **Node.js最低版本**: 0.12.0
- **使用位置**: 数组条件检查
- **示例**: `include.some((v) => typeof v !== 'string')`
- **文件**: `src/core/normalize.ts:23,27`, `src/core/replace.ts:83`

### 3. String.prototype.includes()
- **ES版本**: ES6 (2015)
- **Node.js最低版本**: 4.0.0
- **使用位置**: 字符串包含检查
- **示例**: `if (code.includes(opts.identifier))`
- **文件**: `src/func.ts:33,49`, `src/core/replace.ts:121,156`

### 4. Object()构造函数
- **ES版本**: ES5 (但在此上下文中用于对象规范化)
- **Node.js最低版本**: 0.10.0
- **使用位置**: 对象规范化
- **示例**: `Object(options)`
- **文件**: `src/core/normalize.ts:11`

### 5. JSON.stringify()
- **ES版本**: ES5
- **Node.js最低版本**: 0.10.0
- **使用位置**: 字符串序列化
- **示例**: `replacement: JSON.stringify(functionName)`
- **文件**: `src/core/replace.ts:112,127`

## ES2020 (ECMAScript 2020) 特性

### 1. 空值合并运算符 (Nullish Coalescing Operator)
- **ES版本**: ES2020
- **Node.js最低版本**: 14.0.0
- **使用位置**: 默认值处理
- **示例**: `node.id?.name ?? Consts.AnonymousFunction`
- **文件**: `src/core/find-name.ts:39,43`

### 2. 可选链操作符 (Optional Chaining)
- **ES版本**: ES2020
- **Node.js最低版本**: 14.0.0
- **使用位置**: 安全属性访问
- **示例**: `node.id?.name`
- **文件**: `src/core/find-name.ts:39`

## Node.js特定API

### 1. node:path模块 (ES模块导入)
- **Node.js最低版本**: 14.13.0 (node:前缀支持)
- **使用位置**: 路径处理
- **示例**: `import { basename } from 'node:path';`
- **文件**: `src/func.ts:1`

## TypeScript特性

### 1. const enum (常量枚举)
- **TypeScript特性**: 编译时常量
- **使用位置**: 常量定义
- **示例**: `export const enum Consts { ... }`
- **文件**: `src/common.ts:1,8`

### 2. 类型注解和泛型
- **TypeScript特性**: 类型系统
- **使用位置**: 所有函数和变量
- **示例**: `function findFunctionNameAtPosition(code: string, ast: Node, position: number, fallback: string): string`
- **文件**: 所有TypeScript文件

## 最新的ECMAScript版本支持

### 1. ecmaVersion: 'latest'
- **ES版本**: 支持最新的ECMAScript标准
- **Node.js要求**: 取决于具体特性
- **使用位置**: AST解析配置
- **示例**: `ecmaVersion: 'latest'`
- **文件**: `src/core/replace.ts:54`

### 2. sourceType: 'module'
- **ES版本**: ES6模块支持
- **Node.js最低版本**: 12.0.0
- **使用位置**: 模块解析配置
- **示例**: `sourceType: 'module'`
- **文件**: `src/core/replace.ts:55`

## 已排除的特性

- **String.prototype.replaceAll**: 已在`src/polyfills.ts`中提供polyfill，因此排除在分析之外

## 兼容性总结

### Node.js版本要求
基于使用的ES特性，该项目需要的最低Node.js版本为 **14.0.0**，主要因为：
- ES2020特性（空值合并、可选链）需要Node.js 14+
- node:前缀导入需要Node.js 14.13.0+

### 主要依赖的现代特性
1. **ES6核心语法** (Node.js 6+): 箭头函数、模板字符串、解构赋值等
2. **ES2020操作符** (Node.js 14+): 空值合并、可选链
3. **ES模块系统** (Node.js 12+稳定支持)
4. **TypeScript类型系统** (编译时特性)

### 代码质量评估
该代码库广泛使用了现代JavaScript特性，代码质量较高：
- 使用const/let替代var，避免变量提升问题
- 使用箭头函数保持this上下文
- 使用模板字符串提高可读性
- 使用解构赋值简化代码
- 使用最新的ES特性提升开发体验

代码遵循现代JavaScript开发最佳实践，具有良好的可维护性和可读性。