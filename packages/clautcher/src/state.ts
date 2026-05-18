import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface ClaudeSettings {
  __clautcher_activated_profile?: string;
  [key: string]: unknown;
}

export namespace state {
  export const ClaudeDir = process.env.CLAUTCHER_CLAUDE_DIR ?? join(homedir(), '.claude');

  export const SettingsFile = 'settings.json';

  export function loadSettings(claudeDir: string, settingsFile: string): ClaudeSettings {
    return JSON.parse(readFileSync(join(claudeDir, settingsFile), 'utf-8'));
  }
}
