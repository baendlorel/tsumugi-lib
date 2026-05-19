import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { cctl } from '../../../_shared/utils/color.js';

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
          // return `${leftPad}${cctl.bold}${nameColumn}${cctl.reset}${gap}${line}`;
          return `${leftPad}${nameColumn}${gap}${line}`;
        }
        return `${descriptionIndent}${line}`;
      });
    })
    .join('\n');
}

interface ClaudeSettings {
  clautcher_activated_settings?: string;
  [key: string]: unknown;
}

declare global {
  interface String {
    join(...args: string[]): string;
  }
}

String.prototype.join = function (...args: string[]): string {
  return join(this.toString(), ...args);
};

export namespace settings {
  export const ClaudeDir = process.env.CLAUTCHER_CLAUDE_DIR ?? join(homedir(), '.claude');

  /**
   * Full path of settings.json. For example, /home/user/.claude/settings.json
   */
  export const FilePath = ClaudeDir.join('settings.json');

  /**
   * Full path of settings.base.json.
   *
   * It will be merged with the setting file you choose.
   */
  export const BaseFilePath = ClaudeDir.join('settings.base.json');

  export function load(filePath: string = FilePath): ClaudeSettings {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  export function tryLoad(filePath: string = FilePath): ClaudeSettings | undefined {
    if (!existsSync(filePath)) {
      return undefined;
    }
    return load(filePath);
  }

  export function loadBase(): ClaudeSettings {
    if (!existsSync(BaseFilePath)) {
      return {};
    }
    return load(BaseFilePath);
  }

  export function getActivatedProfileName(): string | undefined {
    return tryLoad(FilePath)?.clautcher_activated_settings;
  }

  export const HelpList: Array<{ command: string; description: string }> = [];
}

type ClautcherErrorType = 'UnknownCommand' | 'InvalidProfileName' | 'NotEnoughArguments' | 'SettingsFileNotFound';

export class ClautcherError extends Error {
  public type: ClautcherErrorType;
  constructor(message: string, type: ClautcherErrorType) {
    super(message);
    this.type = type;
  }
}
