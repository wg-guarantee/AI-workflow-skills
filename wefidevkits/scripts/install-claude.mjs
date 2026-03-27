import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CLAUDE_BUILD_ROOT = path.join(ROOT, 'build', 'claude');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(sourceDir, targetDir) {
  ensureDir(targetDir);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
      continue;
    }

    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function parseArgs(argv) {
  const options = {
    target: 'user',
    projectDir: process.cwd(),
    gitCommitMode: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target') {
      options.target = argv[index + 1] || options.target;
      index += 1;
      continue;
    }
    if (arg === '--project-dir') {
      options.projectDir = argv[index + 1] || options.projectDir;
      index += 1;
      continue;
    }
    if (arg === '--git-commit-mode') {
      options.gitCommitMode = argv[index + 1] || options.gitCommitMode;
      index += 1;
    }
  }

  return options;
}

function normalizeGitCommitMode(mode) {
  if (mode === 'confirm-each' || mode === 'skill-governed' || mode === 'auto') {
    return mode;
  }
  return null;
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {};
  }
}

function writeJsonFile(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function mergeHookCommands(existingHooks = [], sourceHooks = []) {
  const merged = [...existingHooks];
  const seen = new Set(existingHooks.map((hook) => JSON.stringify(hook)));

  for (const hook of sourceHooks) {
    const key = JSON.stringify(hook);
    if (seen.has(key)) {
      continue;
    }
    merged.push(hook);
    seen.add(key);
  }

  return merged;
}

function mergeHookEntries(existingEntries = [], sourceEntries = []) {
  const merged = [...existingEntries];

  for (const sourceEntry of sourceEntries) {
    const sourceMatcher = sourceEntry.matcher || '';
    const existingIndex = merged.findIndex((entry) => (entry.matcher || '') === sourceMatcher);

    if (existingIndex === -1) {
      merged.push(sourceEntry);
      continue;
    }

    const existingEntry = merged[existingIndex];
    merged[existingIndex] = {
      ...existingEntry,
      ...sourceEntry,
      matcher: sourceEntry.matcher ?? existingEntry.matcher,
      hooks: mergeHookCommands(existingEntry.hooks || [], sourceEntry.hooks || [])
    };
  }

  return merged;
}

function mergeSettings(existingSettings = {}, sourceSettings = {}) {
  const existingHooks = existingSettings.hooks || {};
  const sourceHooks = sourceSettings.hooks || {};
  const mergedHooks = { ...existingHooks };

  for (const [eventName, sourceEntries] of Object.entries(sourceHooks)) {
    const existingEntries = existingHooks[eventName] || [];
    mergedHooks[eventName] = mergeHookEntries(existingEntries, sourceEntries);
  }

  return {
    ...existingSettings,
    ...sourceSettings,
    hooks: mergedHooks
  };
}

function writeWefiConfig(targetFile, updates = {}) {
  const existing = readJsonFile(targetFile);
  const config = {
    ...existing,
    ...updates,
    gitCommit: {
      ...(existing.gitCommit || {}),
      ...(updates.gitCommit || {})
    },
    learning: {
      ...(existing.learning || {}),
      ...(updates.learning || {})
    }
  };
  writeJsonFile(targetFile, config);
}

function installUserSkills() {
  const sourceDir = path.join(CLAUDE_BUILD_ROOT, 'skills');
  const targetDir = path.join(os.homedir(), '.claude', 'skills');
  copyDir(sourceDir, targetDir);
  console.log(`Installed wefidevkits skills to ${targetDir}`);
  console.log('Project hooks were not installed for the user target.');
}

function installProjectBundle(projectDir, gitCommitMode) {
  const claudeDir = path.join(projectDir, '.claude');
  const targetSkillsDir = path.join(claudeDir, 'skills');
  const targetHooksDir = path.join(claudeDir, 'hooks');
  const sourceSkillsDir = path.join(CLAUDE_BUILD_ROOT, 'skills');
  const sourceHooksDir = path.join(CLAUDE_BUILD_ROOT, 'hooks');
  const sourceSettingsFile = path.join(CLAUDE_BUILD_ROOT, 'settings.wefidevkits.json');
  const sourceConfigFile = path.join(CLAUDE_BUILD_ROOT, 'wefidevkits.json');
  const settingsFile = path.join(claudeDir, 'settings.json');
  const settingsSnippetFile = path.join(claudeDir, 'settings.wefidevkits.json');
  const settingsBackupFile = path.join(claudeDir, 'settings.backup.before-wefidevkits.json');
  const configFile = path.join(claudeDir, 'wefidevkits.json');

  copyDir(sourceSkillsDir, targetSkillsDir);
  copyDir(sourceHooksDir, targetHooksDir);

  if (gitCommitMode) {
    writeWefiConfig(configFile, {
      ...readJsonFile(sourceConfigFile),
      gitCommit: {
        mode: gitCommitMode
      }
    });
  } else if (!fs.existsSync(configFile)) {
    fs.copyFileSync(sourceConfigFile, configFile);
  }

  if (fs.existsSync(settingsFile)) {
    const existingSettings = readJsonFile(settingsFile);
    const sourceSettings = readJsonFile(sourceSettingsFile);
    const mergedSettings = mergeSettings(existingSettings, sourceSettings);

    fs.copyFileSync(settingsFile, settingsBackupFile);
    writeJsonFile(settingsSnippetFile, sourceSettings);
    writeJsonFile(settingsFile, mergedSettings);
    console.log(`Installed skills and hooks into ${claudeDir}`);
    console.log(`Merged wefidevkits hooks into ${settingsFile}.`);
    console.log(`Backup of the previous settings was saved to ${settingsBackupFile}.`);
    console.log(`Reference snippet was written to ${settingsSnippetFile}.`);
    console.log(`Git commit mode config is at ${configFile}.`);
    return;
  }

  ensureDir(claudeDir);
  fs.copyFileSync(sourceSettingsFile, settingsFile);
  console.log(`Installed skills, hooks, settings, and wefidevkits config to ${claudeDir}`);
}

if (!fs.existsSync(CLAUDE_BUILD_ROOT)) {
  console.error('Claude build output not found. Run `npm run build` first.');
  process.exit(1);
}

const options = parseArgs(process.argv.slice(2));

if (options.target === 'user') {
  installUserSkills();
  process.exit(0);
}

if (options.target === 'project') {
  installProjectBundle(path.resolve(options.projectDir), normalizeGitCommitMode(options.gitCommitMode));
  process.exit(0);
}

console.error(`Unsupported target: ${options.target}`);
process.exit(1);
