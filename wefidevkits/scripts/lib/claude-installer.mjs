import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readJsonFile(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJsonFile(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function normalizeGitCommitMode(mode) {
  if (mode === 'confirm-each' || mode === 'skill-governed' || mode === 'auto') {
    return mode;
  }
  return null;
}

export function relativePosix(baseDir, fullPath) {
  return path.relative(baseDir, fullPath).split(path.sep).join('/');
}

export function collectFiles(baseDir, currentDir = baseDir) {
  if (!fs.existsSync(currentDir)) {
    return [];
  }

  const entries = fs.readdirSync(currentDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(baseDir, fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

export function copyDir(sourceDir, targetDir) {
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

export function copyFile(sourceFile, targetFile, mode = null) {
  ensureDir(path.dirname(targetFile));
  fs.copyFileSync(sourceFile, targetFile);
  if (mode !== null) {
    fs.chmodSync(targetFile, mode);
  }
}

export function mergeHookCommands(existingHooks = [], sourceHooks = []) {
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

export function mergeHookEntries(existingEntries = [], sourceEntries = []) {
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

export function mergeSettings(existingSettings = {}, sourceSettings = {}) {
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

export function writeWefiConfig(targetFile, updates = {}) {
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

export function getTargetInfo(target, projectDir) {
  if (target === 'user') {
    const claudeDir = path.join(os.homedir(), '.claude');
    return {
      targetType: 'user',
      rootDir: claudeDir,
      stateFile: path.join(claudeDir, 'wefidevkits', 'install-state.json'),
      configFile: path.join(claudeDir, 'wefidevkits.json'),
      settingsFile: null,
      settingsSnippetFile: null,
      settingsBackupFile: null,
      skillsDir: path.join(claudeDir, 'skills'),
      hooksDir: null
    };
  }

  const claudeDir = path.join(path.resolve(projectDir), '.claude');
  return {
    targetType: 'project',
    rootDir: claudeDir,
    stateFile: path.join(claudeDir, 'wefidevkits', 'install-state.json'),
    configFile: path.join(claudeDir, 'wefidevkits.json'),
    settingsFile: path.join(claudeDir, 'settings.json'),
    settingsSnippetFile: path.join(claudeDir, 'settings.wefidevkits.json'),
    settingsBackupFile: path.join(claudeDir, 'settings.backup.before-wefidevkits.json'),
    skillsDir: path.join(claudeDir, 'skills'),
    hooksDir: path.join(claudeDir, 'hooks')
  };
}

export function getUpdaterRuntimeInfo(targetInfo) {
  const runtimeRoot = path.join(targetInfo.rootDir, 'wefidevkits');
  return {
    runtimeRoot,
    binDir: path.join(runtimeRoot, 'bin'),
    libDir: path.join(runtimeRoot, 'bin', 'lib'),
    sharedDir: path.join(runtimeRoot, 'bin', 'shared')
  };
}

export function installUpdaterRuntime(sourceScriptsRoot, targetInfo) {
  const runtime = getUpdaterRuntimeInfo(targetInfo);
  ensureDir(runtime.binDir);
  ensureDir(runtime.libDir);
  ensureDir(runtime.sharedDir);

  copyFile(path.join(sourceScriptsRoot, 'update-claude.mjs'), path.join(runtime.binDir, 'update-claude.mjs'), 0o755);
  copyFile(path.join(sourceScriptsRoot, 'setup-security-monitoring.mjs'), path.join(runtime.binDir, 'setup-security-monitoring.mjs'), 0o755);
  copyFile(path.join(sourceScriptsRoot, 'lib', 'claude-installer.mjs'), path.join(runtime.libDir, 'claude-installer.mjs'));
  copyDir(path.join(sourceScriptsRoot, '..', 'shared', 'security'), path.join(runtime.sharedDir, 'security'));

  const launcher = [
    '#!/bin/sh',
    'SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"',
    'exec node "$SCRIPT_DIR/update-claude.mjs" "$@"',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(runtime.binDir, 'wefidevkits-update'), launcher, { mode: 0o755 });

  const securityLauncher = [
    '#!/bin/sh',
    'SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"',
    'exec node "$SCRIPT_DIR/setup-security-monitoring.mjs" "$@"',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(runtime.binDir, 'wefidevkits-setup-security'), securityLauncher, { mode: 0o755 });

  return runtime;
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function buildManagedStateEntries(baseDir, targetRoot, logicalPrefix, rootDir) {
  const entries = [];
  if (!fs.existsSync(baseDir)) {
    return entries;
  }

  for (const fullPath of collectFiles(baseDir)) {
    const relativePath = relativePosix(baseDir, fullPath);
    const targetPath = path.join(targetRoot, relativePath);
    entries.push({
      path: relativePosix(rootDir, targetPath),
      logicalTarget: `${logicalPrefix}/${relativePath}`,
      sha256: sha256File(targetPath)
    });
  }

  return entries;
}

export function buildInstallState(targetInfo, releaseInfo, packageName = 'wefidevkits', host = 'claude') {
  const managedFiles = [];

  if (fs.existsSync(targetInfo.skillsDir)) {
    managedFiles.push(...buildManagedStateEntries(targetInfo.skillsDir, targetInfo.skillsDir, 'skills', targetInfo.rootDir));
  }

  if (targetInfo.hooksDir && fs.existsSync(targetInfo.hooksDir)) {
    managedFiles.push(...buildManagedStateEntries(targetInfo.hooksDir, targetInfo.hooksDir, 'hooks', targetInfo.rootDir));
  }

  if (targetInfo.settingsSnippetFile && fs.existsSync(targetInfo.settingsSnippetFile)) {
    managedFiles.push({
      path: relativePosix(targetInfo.rootDir, targetInfo.settingsSnippetFile),
      logicalTarget: 'settings.wefidevkits.json',
      sha256: sha256File(targetInfo.settingsSnippetFile)
    });
  }

  if (fs.existsSync(targetInfo.configFile)) {
    managedFiles.push({
      path: relativePosix(targetInfo.rootDir, targetInfo.configFile),
      logicalTarget: 'wefidevkits.json',
      sha256: sha256File(targetInfo.configFile)
    });
  }

  return {
    packageName,
    host,
    targetType: targetInfo.targetType,
    installedVersion: releaseInfo.version,
    installSchemaVersion: 1,
    installedAt: new Date().toISOString(),
    release: {
      repository: releaseInfo.repository,
      tag: releaseInfo.tag
    },
    managedFiles
  };
}

export function applyProjectSettings(sourceSettingsFile, targetInfo) {
  if (!targetInfo.settingsFile || !sourceSettingsFile || !fs.existsSync(sourceSettingsFile)) {
    return;
  }

  const sourceSettings = readJsonFile(sourceSettingsFile, {});
  const existingSettings = readJsonFile(targetInfo.settingsFile, {});

  ensureDir(targetInfo.rootDir);
  if (fs.existsSync(targetInfo.settingsFile)) {
    fs.copyFileSync(targetInfo.settingsFile, targetInfo.settingsBackupFile);
  }

  writeJsonFile(targetInfo.settingsSnippetFile, sourceSettings);
  writeJsonFile(targetInfo.settingsFile, mergeSettings(existingSettings, sourceSettings));
}
