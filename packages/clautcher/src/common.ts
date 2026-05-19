import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

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
  return [this, ...args].join('');
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

  export function loadBase(): ClaudeSettings {
    if (!existsSync(BaseFilePath)) {
      return {};
    }
    return load(BaseFilePath);
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
