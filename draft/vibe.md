完成这个工具，效果是：
1、运行lines . 的时候，递归计算当前目录下代码行数；
2、在~/.how-many-lines.json中建立自己的配置文件，里面有忽略的文件、文件夹glob和支持的后缀名；
  如果配置文件不存在，那么创建一个，默认排除的有:
  ```
  .git node_modules dist build coverage out logs
  .vscode .idea .DS_Store .claude
  ```
  默认支持的都是常见的代码文件后缀名；
  配置文件大概为:
  ```json
  {
    "suffix":[...],
    "exclude":[...]
  }
  ```
3、支持的后缀名包括所有常见编程语言，也包括像是css、scss等这类，也包含配置文件；4、输出格式为什么后缀名的文件有多少行，最后输出总行数；
```text
.ts    2999
.js    1133
.json  200
```
会按照后缀名长度进行一个对齐；
5、lines -v显示版本号，lines -h显示帮助信息；
6、支持`lines .`命令，只能计算当前文件夹，且优先级最高；
7、支持`lines -p xxx`命令，递归地收集指定路径的代码行数；


---
继续优化：
1、-v不再显示版本，由-V显示
2、-v表示verbose，将会展示每一个suffix的文件列表和行数，格式为：
```txt
.ts    2999
  -  233 xxx/aa.ts
  - 3444 xxx/bb.ts
.js    1133
  - 1133 xxx/cc.js
.json  200
  -  200 xxx/dd.json
```
行数+空格+文件路径，这里需要注意对齐所有的行数数字。
3、如果不加-v，就只会显示每种后缀名文件整体有多少行
```text
.ts    2999
.js    1133
.json  200
```