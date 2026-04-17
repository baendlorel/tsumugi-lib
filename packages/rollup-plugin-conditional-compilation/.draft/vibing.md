```javascript
if (1) {
  if (1) {
  }
}
```

一个if块是:

```javascript
const a = {
  startindex: 1,
  endindex: 10,
  children: [], // children子块的start/endindex必须从小到大
};
```

但是从上到下的扫描里，必须有的内容是:

```javascript
// #if
// #endif
```

这样的一行一行的指令，因此还需要一个表示指令行的类型

```javascript
const DirvBlock = {
  dirv: '#if',
  start: 1,
  end: 3,
};
```

先解析出来，至于什么包裹结构，后面再说
