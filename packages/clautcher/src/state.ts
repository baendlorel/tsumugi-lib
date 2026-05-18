import { homedir } from 'node:os';
import { join } from 'node:path';

export namespace state {
  export const claudeDir = process.env.CLAUTCHER_CLAUDE_DIR ?? join(homedir(), '.claude');
  export const settingsFile = join(claudeDir, 'settings.json');
}
