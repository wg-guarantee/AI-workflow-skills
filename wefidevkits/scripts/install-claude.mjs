import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applyProjectSettings,
  buildInstallState,
  copyDir,
  ensureDir,
  getTargetInfo,
  installUpdaterRuntime,
  normalizeGitCommitMode,
  readJsonFile,
  writeJsonFile,
  writeWefiConfig
} from './lib/claude-installer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CLAUDE_BUILD_ROOT = path.join(ROOT, 'build', 'claude');
const SCRIPTS_ROOT = path.join(ROOT, 'scripts');
const PACKAGE_META = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const INSTALL_RELEASE = {
  repository: 'wg-guarantee/AI-workflow-skills',
  tag: `v${PACKAGE_META.version}`,
  version: PACKAGE_META.version
};

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

function installUserSkills() {
  const targetInfo = getTargetInfo('user', process.cwd());
  const sourceDir = path.join(CLAUDE_BUILD_ROOT, 'skills');
  const targetDir = targetInfo.skillsDir;
  copyDir(sourceDir, targetDir);
  const runtime = installUpdaterRuntime(SCRIPTS_ROOT, targetInfo);
  writeJsonFile(targetInfo.stateFile, buildInstallState(targetInfo, INSTALL_RELEASE));
  console.log(`Installed wefidevkits skills to ${targetDir}`);
  console.log(`Installed updater runtime to ${runtime.binDir}`);
  console.log(`Install state written to ${targetInfo.stateFile}`);
  console.log('Project hooks were not installed for the user target.');
}

function installProjectBundle(projectDir, gitCommitMode) {
  const targetInfo = getTargetInfo('project', projectDir);
  const claudeDir = targetInfo.rootDir;
  const targetSkillsDir = targetInfo.skillsDir;
  const targetHooksDir = targetInfo.hooksDir;
  const sourceSkillsDir = path.join(CLAUDE_BUILD_ROOT, 'skills');
  const sourceHooksDir = path.join(CLAUDE_BUILD_ROOT, 'hooks');
  const sourceSettingsFile = path.join(CLAUDE_BUILD_ROOT, 'settings.wefidevkits.json');
  const sourceConfigFile = path.join(CLAUDE_BUILD_ROOT, 'wefidevkits.json');
  const configFile = targetInfo.configFile;

  copyDir(sourceSkillsDir, targetSkillsDir);
  copyDir(sourceHooksDir, targetHooksDir);
  const runtime = installUpdaterRuntime(SCRIPTS_ROOT, targetInfo);

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

  if (fs.existsSync(targetInfo.settingsFile)) {
    applyProjectSettings(sourceSettingsFile, targetInfo);
    writeJsonFile(targetInfo.stateFile, buildInstallState(targetInfo, INSTALL_RELEASE));
    console.log(`Installed skills and hooks into ${claudeDir}`);
    console.log(`Merged wefidevkits hooks into ${targetInfo.settingsFile}.`);
    console.log(`Backup of the previous settings was saved to ${targetInfo.settingsBackupFile}.`);
    console.log(`Reference snippet was written to ${targetInfo.settingsSnippetFile}.`);
    console.log(`Git commit mode config is at ${configFile}.`);
    console.log(`Updater runtime is at ${runtime.binDir}.`);
    console.log(`Install state written to ${targetInfo.stateFile}`);
    return;
  }

  ensureDir(claudeDir);
  fs.copyFileSync(sourceSettingsFile, targetInfo.settingsFile);
  writeJsonFile(targetInfo.stateFile, buildInstallState(targetInfo, INSTALL_RELEASE));
  console.log(`Installed skills, hooks, settings, and wefidevkits config to ${claudeDir}`);
  console.log(`Updater runtime is at ${runtime.binDir}.`);
  console.log(`Install state written to ${targetInfo.stateFile}`);
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
