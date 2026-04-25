// <svg width="380" height="120">
//   <g font-size="1rem" fill="#007ACC" font-family="monospace">
//     <text y="25">rollup-plugin-conditional-compilation</text>
//     <text y="55">rollup-plugin-conditional-compilation</text>
//     <text y="85">rollup-plugin-conditional-compilation</text>
//   </g>
//   <g font-size="1rem" fill="#88b1c6" font-family="monospace">
//     <text x="300" y="25">历练</text>
//     <text x="300" y="55">历练</text>
//     <text x="300" y="85">历练</text>
//   </g>
// </svg>

import { g, h, measureTextWidth, text } from './h.js';

const wrapText = (text: string, maxWidth: number, fontSize: number) => {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text.trim()) {
    const nextLine = `${currentLine}${char}`;
    if (char !== '\n' && measureTextWidth(nextLine, fontSize) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    currentLine = char === '\n' ? '' : char.trimStart();
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.length > 0 ? lines : [''];
};

export const col = (attr: { width: number; fontSize: number }, contents: string[]) => {
  const { width = 200, fontSize = 16 } = attr;
  const list: any[] = [];

  for (let i = 0; i < contents.length; i++) {
    const t = contents[i];
    list.push(...wrapText(t, width, fontSize));
  }

  g({ 'font-size': `1rem`, fill: '#007ACC', 'font-family': 'monospace' }, [
    list.map((t) => text({ x: '0', y: '0', fill: '#007ACC' }, t)),
  ]);
};
