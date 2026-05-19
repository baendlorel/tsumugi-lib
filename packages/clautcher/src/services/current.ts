import { state } from '../common.js';

export function current(claudeDir: string, settingsFile: string): void {
  const json = state.loadSettings(claudeDir, settingsFile);
}
