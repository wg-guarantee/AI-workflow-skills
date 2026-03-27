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
  ensureDir(path.dirname(targetFile));
  fs.writeFileSync(targetFile, `${JSON.stringify(config, null, 2)}\n`);
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
    fs.copyFileSync(sourceSettingsFile, settingsSnippetFile);
    console.log(`Installed skills and hooks into ${claudeDir}`);
    console.log(`Existing settings preserved. Merge hooks from ${settingsSnippetFile} into ${settingsFile}.`);
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
