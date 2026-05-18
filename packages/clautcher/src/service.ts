import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ClaudePaths {
  claudeDir: string;
  profilesDir: string;
  settingsFile: string;
  stateFile: string;
}

export interface ProfileSummary {
  name: string;
  filePath: string;
  isActive: boolean;
}

interface SwitchState {
  activeProfile: string;
  updatedAt: string;
}

export function resolveClaudePaths(
  claudeDir = process.env.CLAUTCHER_CLAUDE_DIR ?? join(homedir(), '.claude'),
): ClaudePaths {
  return {
    claudeDir,
    profilesDir: join(claudeDir, 'profiles'),
    settingsFile: join(claudeDir, 'settings.json'),
    stateFile: join(claudeDir, '.clautcher.json'),
  };
}

export function getProfilePath(profileName: string, claudeDir?: string): string {
  const paths = resolveClaudePaths(claudeDir);
  return join(paths.profilesDir, `${profileName}.json`);
}

export function getActiveProfileName(claudeDir?: string): string | null {
  const paths = resolveClaudePaths(claudeDir);
  if (!existsSync(paths.stateFile) || !existsSync(paths.settingsFile)) {
    return null;
  }

  try {
    const state = JSON.parse(readFileSync(paths.stateFile, 'utf-8')) as Partial<SwitchState>;
    if (!state.activeProfile) {
      return null;
    }

    const profileFile = getProfilePath(state.activeProfile, claudeDir);
    if (!existsSync(profileFile)) {
      return null;
    }

    const profileContent = readFileSync(profileFile, 'utf-8').trim();
    const settingsContent = readFileSync(paths.settingsFile, 'utf-8').trim();

    return profileContent === settingsContent ? state.activeProfile : null;
  } catch {
    return null;
  }
}

export function listProfiles(claudeDir?: string): ProfileSummary[] {
  const paths = resolveClaudePaths(claudeDir);
  if (!existsSync(paths.profilesDir)) {
    return [];
  }

  const activeProfile = getActiveProfileName(claudeDir);

  return readdirSync(paths.profilesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const name = entry.name.slice(0, -'.json'.length);
      return {
        name,
        filePath: join(paths.profilesDir, entry.name),
        isActive: name === activeProfile,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function switchProfile(profileName: string, claudeDir?: string): string {
  const paths = resolveClaudePaths(claudeDir);
  const profileFile = getProfilePath(profileName, claudeDir);

  if (!existsSync(profileFile)) {
    throw new Error(`Profile "${profileName}" was not found in ${paths.profilesDir}.`);
  }

  mkdirSync(paths.claudeDir, { recursive: true });
  copyFileSync(profileFile, paths.settingsFile);
  writeFileSync(
    paths.stateFile,
    JSON.stringify(
      {
        activeProfile: profileName,
        updatedAt: new Date().toISOString(),
      } satisfies SwitchState,
      null,
      2,
    ) + '\n',
    'utf-8',
  );

  return paths.settingsFile;
}
