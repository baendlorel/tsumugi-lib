/** 一个 ```liuyao 代码块 */
export interface 代码块 {
  /** 开始围栏（```liuyao）所在的行号，从 1 开始 */
  行号: number;
  /** 代码块内部的行，不含起止围栏 */
  行: string[];
}

/**
 * 扫描 Markdown 等文本里用 ```liuyao 围栏标记的代码块。
 *
 * 不绑定具体编辑器：任何把卦象写进 ```liuyao 代码块的地方都能读到。
 * 块内容原样保留（由调用方 trim），行号按原文件计算。
 * 找不到收尾围栏时抛错，错误信息里带上文件路径和起始行号。
 */
export function 扫描代码块(原文: string, 文件路径?: string): 代码块[] {
  // 按原样切行，不改动内容，行号才对得上
  const 行 = 原文.split('\n');
  const 块列表: 代码块[] = [];

  for (let i = 0; i < 行.length; i++) {
    if (!行[i]!.trim().startsWith('```liuyao')) {
      continue;
    }

    const 行号 = i + 1;
    const 行内容: string[] = [];
    let 已闭合 = false;

    for (i++; i < 行.length; i++) {
      if (行[i]!.trim().startsWith('```')) {
        已闭合 = true;
        break;
      }
      行内容.push(行[i]!);
    }

    if (!已闭合) {
      throw new Error(`${文件路径 ? `${文件路径} ` : ''}第 ${行号} 行的 \`\`\`liuyao 代码块没有闭合`);
    }

    块列表.push({ 行号, 行: 行内容 });
  }

  return 块列表;
}
