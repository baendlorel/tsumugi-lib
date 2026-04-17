制作一个rollup插件，要求做到以下几点：

1. 主要功能是将代码中出现的`__func__`替换为所在区域的函数名
2. 语法树解析用acorn
3. 入参为options，包含字段：
   - `identifier`，用来配置`__func__`为别的格式，比如配置成`__function_name__`。
   - `include`，用来配置需要处理的文件类型，默认为`['**/*.js', '**/*.ts']`
   - `exclude` ，用来配置不需要处理的文件类型，默认为`['node_modules/**']`
   - `fallback`，用来配置在无法找到函数名时的替代值，默认为`'unknown'`
4. 只处理函数声明、函数表达式、类方法，箭头函数不处理。在上下文中搜索时，也要突破箭头函数继续寻找外层函数名字；
5. 主要代码写在src/func.ts下，如需添加辅助ts文件，也可以添加
6. 需要添加单元测试，测试用例放在tests/func.test.ts

---

优化:

1.  要允许字符串内部的`__func__`可以被替换，由options.stringReplace控制，默认开启
2.  将此特性写入readme。

解答:
如果想要让用户安装了本包后，global.d.ts里的`__func__`就能全局生效不需要引入，可以做到吗,是否要起名为@types/xxx才行？

---

我发现了一个严重的问题。按照我现在这样写的代码，在作为plugin去解析js代码的过程中，会产生这个错误

```text
vite v7.1.7 building for production...
✓ 4 modules transformed.
[static-copy] Copied assets/css to dist/assets
✗ Build failed in 799ms
error during build:
src/background.ts (263:95): Expected ',', got 'open' (Note that you need plugins to import files that are not JavaScript)
file: /home/aldia/projects/plugins/firefox-workspaces/src/background.ts:263:95

261:         }
262:         catch (error) {
263:             console.error(`[__NAME__: ${__func__}]__func__ Failed to open popup window:`, error);
                                                                                                    ^
264:         }
265:     }

    at getRollupError (file:///home/aldia/projects/plugins/firefox-workspaces/node_modules/.pnpm/rollup@4.52.0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
    at ParseError.initialise (file:///home/aldia/projects/plugins/firefox-workspaces/node_modules/.pnpm/rollup@4.52.0/node_modules/rollup/dist/es/shared/node-entry.js:14475:28)
    at convertNode (file:///home/aldia/projects/plugins/firefox-workspaces/node_modules/.pnpm/rollup@4.52.0/node_modules/rollup/dist/es/shared/node-entry.js:16358:10)
    at convertProgram (file:///home/aldia/projects/plugins/firefox-workspaces/node_modules/.pnpm/rollup@4.52.0/node_modules/rollup/dist/es/shared/node-entry.js:15598:12)
    at Module.setSource (file:///home/aldia/projects/plugins/firefox-workspaces/node_modules/.pnpm/rollup@4.52.0/node_modules/rollup/dist/es/shared/node-entry.js:17353:24)
    at async ModuleLoader.addModuleSource (file:///home/aldia/projects/plugins/firefox-workspaces/node_modules/.pnpm/rollup@4.52.0/node_modules/rollup/dist/es/shared/node-entry.js:21371:13)
 ELIFECYCLE  Command failed with exit code
```

根据推测，是这一行

```ts
console.error(`[__NAME__: ${__func__}]__func__ Failed to open popup window:`, error);
```

导致的，出现的两次**func**导致acorn解析失败，如果只有第一个`${__func__}`或者只有后面的`__func__`，就不会报错。
但是这个怎么会解析错误？你看看到底是acorn的原因，还是我的原因

---

进一步优化，将模板字符串`xxx${identifier}xxx`里的`${identifier}`直接整个替换，而不是替换成`${"某个函数名"}`这样。

---

MethodDefinition的handler里缺少对一般表达式的支持，如果这里是'a'+somevariable，或者getnewfunctionname()函数调用，应该也要能够正确解析，要求如下：

1. 为避免再次计算会产生副作用。把表达式的“字符串”来替换，而不是真的替换表达式
2. 你不要创建新的test文件，只需考虑已有的tests/complex.test.ts文件里的测试用例:`it('should be literal'`

---

增加一个`__file__`宏，功能类似`__func__`，但表示当前文件名，要求如下：

1. 替换规则和`__func__`相同，可复用
2. 值为transform的入参`id`
3. 可以配置自定义标识符，比如`__filename__`，默认值位于common.ts里的`Macro.File`字段
