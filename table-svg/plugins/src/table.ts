import { type HChild, g, measureTextWidth, text } from './h.ts';

interface ColProps {
  x: number;
  width: number;
  fontSize: number;
  color: string;
}

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
