import { cctl } from '../../../_shared/utils/color.js';
import { state } from '../common.js';

export function current(claudeDir: string, settingsFile: string): void {
  const json = state.loadSettings(claudeDir, settingsFile);
  console.log(`${cctl.bold}${cctl.underline}Now Using:${cctl.reset}`);
  if (json.clautcher_activated_settings) {
    console.log(`  ${cctl.brightGreen}${json.clautcher_activated_settings}${cctl.reset}`);
  } else {
    console.log(`  ${cctl.dim}None (Not managed by clautcher yet)${cctl.reset}`);
  }
}

export function cmdTable(args: {
  cmds: Array<{ name: string; description: string }>;
  indent: number;
  maxWidth: number;
}) {
  const { cmds, indent, maxWidth } = args;

  const leftPad = ' '.repeat(Math.max(0, indent));
  const gap = '  ';
  const nameWidth = Math.max(...cmds.map((cmd) => Array.from(cmd.name).length), 0);
  const descriptionWidth = Math.max(1, maxWidth);

  const chunkText = (text: string) => {
    const normalized = text.trim().replace(/\s+/g, ' ');
    if (normalized.length === 0) {
      return [''];
    }

    const words = normalized.split(' ');
    const lines: string[] = [];
    let current = '';

    const pushBrokenWord = (word: string) => {
      let rest = word;
      while (Array.from(rest).length > descriptionWidth) {
        const slice = Array.from(rest).slice(0, descriptionWidth).join('');
        lines.push(slice);
        rest = Array.from(rest).slice(descriptionWidth).join('');
      }
      return rest;
    };

    for (const word0 of words) {
      let word = word0;
      if (Array.from(word).length > descriptionWidth) {
        if (current) {
          lines.push(current);
          current = '';
        }
        word = pushBrokenWord(word);
      }

      if (!word) {
        continue;
      }

      const next = current ? `${current} ${word}` : word;
      if (Array.from(next).length <= descriptionWidth) {
        current = next;
        continue;
      }

      if (current) {
        lines.push(current);
      }
      current = word;
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  };

  return cmds
    .flatMap((cmd) => {
      const wrapped = chunkText(cmd.description);
      const nameColumn = cmd.name.padEnd(nameWidth, ' ');
      const descriptionIndent = `${leftPad}${' '.repeat(nameWidth)}${gap}`;

      return wrapped.map((line, index) => {
        if (index === 0) {
          return `${leftPad}${cctl.bold}${nameColumn}${cctl.reset}${gap}${line}`;
        }
        return `${descriptionIndent}${line}`;
      });
    })
    .join('\n');
}
