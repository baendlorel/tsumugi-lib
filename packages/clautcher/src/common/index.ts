import { cctl } from '@shared/utils/color.js';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface ClaudeSettings {
  clautcher_activated_settings?: string;
  [key: string]: unknown;
}

export namespace settings {
  export const ClaudeDir = process.env.CLAUTCHER_CLAUDE_DIR ?? join(homedir(), '.claude');

  /**
   * Full path of settings.json. For example, /home/user/.claude/settings.json
   */
  export const FilePath = join(ClaudeDir, 'settings.json');

  /**
   * Full path of settings.base.json.
   *
   * It will be merged with the setting file you choose.
   */
  export const BaseFilePath = join(ClaudeDir, 'settings.base.json');

  export function load(filePath: string = FilePath): ClaudeSettings {
    try {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === 'ENOENT') {
        throw new ClautcherError(`Settings file not found: ${filePath}`, 'SettingsFileNotFound');
      }
      throw new ClautcherError(`Failed to parse settings file: ${filePath}`, 'InvalidProfileName');
    }
  }

  export function tryLoad(filePath: string = FilePath): ClaudeSettings | undefined {
    if (!existsSync(filePath)) {
      return undefined;
    }
    return load(filePath);
  }

  export function baseExists(): boolean {
    return existsSync(BaseFilePath);
  }

  export function loadBase(): ClaudeSettings {
    if (!baseExists()) {
      return {};
    }
    return load(BaseFilePath);
  }

  export function getActivatedProfileName(): string | undefined {
    return tryLoad(FilePath)?.clautcher_activated_settings;
  }
}

type ClautcherErrorType =
  | 'NoSettingsFile'
  | 'UnknownCommand'
  | 'InvalidProfileName'
  | 'NotEnoughArguments'
  | 'SettingsFileNotFound';

export class ClautcherError extends Error {
  public type: ClautcherErrorType;
  constructor(message: string, type: ClautcherErrorType) {
    super(message);
    this.type = type;
  }
}

/**
 * Beautify names of LLMs.
 */
export const beautifyLLMName = (name: string) => {
  const lowered = name.toLowerCase();
  if (lowered.includes('deepseek')) {
    return `${cctl.deepseek}${name}${cctl.reset}`;
  }
  if (lowered.startsWith('gpt') || lowered.match(/\bgpt\b/)) {
    return `${cctl.gpt}${name}${cctl.reset}`;
  }
  if (lowered.includes('claude')) {
    return `${cctl.claude}${name}${cctl.reset}`;
  }
  return name;
};
