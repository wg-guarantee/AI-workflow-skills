#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  applyProjectSettings,
  buildInstallState,
  collectFiles,
  ensureDir,
  getTargetInfo,
  getUpdaterRuntimeInfo,
  installUpdaterRuntime,
  normalizeGitCommitMode,
  readJsonFile,
  relativePosix,
  sha256File,
  writeJsonFile,
  writeWefiConfig
} from './lib/claude-installer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_REPOSITORY = 'wg-guarantee/AI-workflow-skills';
const PACKAGE_NAME = 'wefidevkits';
const HOST = 'claude';

function parseArgs(argv) {
  const options = {
    target: 'project',
    projectDir: process.cwd(),
    repo: DEFAULT_REPOSITORY,
    repoProvided: false,
    version: null,
    check: false,
    dryRun: false,
    fromLocalBuild: false,
    gitCommitMode: null,
    forceManaged: false,
    forceDownload: false,
    repair: false
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
    if (arg === '--repo') {
      options.repo = argv[index + 1] || options.repo;
      options.repoProvided = true;
      index += 1;
      continue;
    }
    if (arg === '--version') {
      options.version = argv[index + 1] || options.version;
      index += 1;
      continue;
    }
    if (arg === '--git-commit-mode') {
      options.gitCommitMode = argv[index + 1] || options.gitCommitMode;
      index += 1;
      continue;
    }
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--from-local-build') {
      options.fromLocalBuild = true;
      continue;
    }
    if (arg === '--force-managed') {
      options.forceManaged = true;
      continue;
    }
    if (arg === '--force-download') {
      options.forceDownload = true;
      continue;
    }
    if (arg === '--repair') {
      options.repair = true;
      options.forceManaged = true;
      options.forceDownload = true;
    }
  }

  return options;
}

function normalizedJsonHash(filePath) {
  const parsed = readJsonFile(filePath, null);
  if (parsed === null) {
    return null;
  }
  return crypto.createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
}

function fileHashForPlanning(filePath) {
  if (filePath.endsWith('.json')) {
    const hash = normalizedJsonHash(filePath);
    if (hash) {
      return hash;
    }
  }
  return sha256File(filePath);
}

function copyFileIfChanged(sourceFile, targetFile) {
  ensureDir(path.dirname(targetFile));
  if (fs.existsSync(targetFile) && fileHashForPlanning(sourceFile) === fileHashForPlanning(targetFile)) {
    return false;
  }
  fs.copyFileSync(sourceFile, targetFile);
  return true;
}

function readInstalledState(targetInfo) {
  return readJsonFile(targetInfo.stateFile, null);
}

function parseChecksumFile(filePath, expectedAssetName) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);
    if (!match) {
      continue;
    }
    if (match[2] === expectedAssetName) {
      return match[1].toLowerCase();
    }
  }
  throw new Error(`checksum for ${expectedAssetName} not found in ${filePath}`);
}

function httpGetJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'wefidevkits-updater', Accept: 'application/vnd.github+json', ...headers } }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if ((response.statusCode || 0) >= 400) {
          reject(new Error(`request failed: ${response.statusCode} ${text.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(text));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
  });
}

function downloadToFile(url, targetFile, headers = {}) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(targetFile));
    const file = fs.createWriteStream(targetFile);
    const request = https.get(url, { headers: { 'User-Agent': 'wefidevkits-updater', ...headers } }, (response) => {
      if ((response.statusCode || 0) >= 400) {
        file.close(() => {
          fs.rmSync(targetFile, { force: true });
          reject(new Error(`download failed: ${response.statusCode}`));
        });
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    request.on('error', (error) => {
      file.close(() => {
        fs.rmSync(targetFile, { force: true });
        reject(error);
      });
    });
  });
}

async function resolveReleaseMetadata(repository, requestedVersion) {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const endpoint = requestedVersion
    ? `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(requestedVersion)}`
    : `https://api.github.com/repos/${repository}/releases/latest`;
  const release = await httpGetJson(endpoint, headers);
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const bundleAsset = assets.find((asset) => typeof asset.name === 'string' && asset.name.endsWith('.tar.gz') && asset.name.includes('wefidevkits-claude-code-'));
  const checksumAsset = assets.find((asset) => typeof asset.name === 'string' && asset.name.endsWith('.sha256.txt'));

  if (!bundleAsset || !checksumAsset) {
    throw new Error('release is missing bundle or checksum asset');
  }

  return {
    repository,
    version: String(release.tag_name || '').replace(/^v/, ''),
    tag: release.tag_name,
    bundleAssetName: bundleAsset.name,
    checksumAssetName: checksumAsset.name,
    bundleUrl: bundleAsset.browser_download_url,
    checksumUrl: checksumAsset.browser_download_url,
    token
  };
}

function loadLocalBuildReleaseInfo() {
  const packageMeta = readJsonFile(path.join(ROOT, 'package.json'));
  const version = packageMeta.version || '0.0.0';
  const buildRoot = path.join(ROOT, 'build', 'claude');
  if (!fs.existsSync(buildRoot)) {
    throw new Error('--from-local-build requires a repository checkout with build output; run from the wefidevkits repo or use the repo-local update script');
  }
  return {
    repository: DEFAULT_REPOSITORY,
    version,
    tag: `v${version}`,
    buildRoot,
    source: 'local-build'
  };
}

async function ensureReleaseWorkspace(options, targetInfo) {
  if (options.fromLocalBuild) {
    const localInfo = loadLocalBuildReleaseInfo();
    return {
      ...localInfo,
      buildRoot: localInfo.buildRoot,
      scriptsRoot: path.join(ROOT, 'scripts')
    };
  }

  const releaseInfo = await resolveReleaseMetadata(options.repo, options.version);
  const cacheBase = targetInfo.targetType === 'user'
    ? path.join(process.env.HOME || '', '.cache', 'wefidevkits', 'releases')
    : path.join(targetInfo.rootDir, 'wefidevkits', 'cache', 'releases');
  const releaseCacheDir = path.join(cacheBase, releaseInfo.tag);
  const bundlePath = path.join(releaseCacheDir, releaseInfo.bundleAssetName);
  const checksumPath = path.join(releaseCacheDir, releaseInfo.checksumAssetName);
  const unpackedDir = path.join(releaseCacheDir, 'unpacked');

  ensureDir(releaseCacheDir);
  if (options.forceDownload) {
    fs.rmSync(bundlePath, { force: true });
    fs.rmSync(checksumPath, { force: true });
    fs.rmSync(unpackedDir, { recursive: true, force: true });
  }
  if (!fs.existsSync(bundlePath)) {
    await downloadToFile(releaseInfo.bundleUrl, bundlePath, releaseInfo.token ? { Authorization: `Bearer ${releaseInfo.token}` } : {});
  }
  if (!fs.existsSync(checksumPath)) {
    await downloadToFile(releaseInfo.checksumUrl, checksumPath, releaseInfo.token ? { Authorization: `Bearer ${releaseInfo.token}` } : {});
  }

  const expectedChecksum = parseChecksumFile(checksumPath, releaseInfo.bundleAssetName);
  const actualChecksum = sha256File(bundlePath);
  if (actualChecksum !== expectedChecksum) {
    throw new Error(`checksum mismatch for ${releaseInfo.bundleAssetName}`);
  }

  if (!fs.existsSync(path.join(unpackedDir, 'build', 'claude', 'update-manifest.json'))) {
    fs.rmSync(unpackedDir, { recursive: true, force: true });
    ensureDir(unpackedDir);
    execFileSync('tar', ['-xzf', bundlePath, '-C', unpackedDir], { stdio: 'inherit' });
  }

  const unpackedEntries = fs.readdirSync(unpackedDir).filter((name) => !name.startsWith('.')).sort();
  if (unpackedEntries.length !== 1) {
    throw new Error('unexpected bundle layout after unpack');
  }

  const bundleRoot = path.join(unpackedDir, unpackedEntries[0], 'build', 'claude');
  const scriptsRoot = path.join(unpackedDir, unpackedEntries[0], 'scripts');
  return {
    ...releaseInfo,
    buildRoot: bundleRoot,
    scriptsRoot,
    source: 'github-release'
  };
}

function expectedTargetHash(installedState, targetInfo, targetFile) {
  const targetRelativePath = relativePosix(targetInfo.rootDir, targetFile);
  const entry = installedState?.managedFiles?.find((item) => item.path === targetRelativePath);
  return entry?.sha256 || null;
}

function planEntryForFile(sourceFile, targetFile, targetInfo, installedState, forceManaged) {
  if (!fs.existsSync(targetFile)) {
    return { action: 'add', sourceFile, targetFile };
  }

  const sourceHash = fileHashForPlanning(sourceFile);
  const targetHash = fileHashForPlanning(targetFile);
  if (sourceHash === targetHash) {
    return { action: 'keep', sourceFile, targetFile };
  }

  const previousHash = expectedTargetHash(installedState, targetInfo, targetFile);
  if (previousHash && previousHash !== targetHash) {
    if (forceManaged) {
      return {
        action: 'update',
        sourceFile,
        targetFile,
        reason: 'forced overwrite of locally modified managed file'
      };
    }
    return {
      action: 'conflict',
      sourceFile,
      targetFile,
      reason: 'target file has local modifications since the last install'
    };
  }

  return { action: 'update', sourceFile, targetFile };
}

function buildPlan(sourceRoot, targetInfo, installedState, forceManaged) {
  const plan = [];
  const sourceSkillsDir = path.join(sourceRoot, 'skills');
  if (fs.existsSync(sourceSkillsDir)) {
    for (const sourceFile of collectFiles(sourceSkillsDir)) {
      const relativePath = relativePosix(sourceSkillsDir, sourceFile);
      const targetFile = path.join(targetInfo.skillsDir, relativePath);
      plan.push(planEntryForFile(sourceFile, targetFile, targetInfo, installedState, forceManaged));
    }
  }

  if (targetInfo.hooksDir) {
    const sourceHooksDir = path.join(sourceRoot, 'hooks');
    if (fs.existsSync(sourceHooksDir)) {
      for (const sourceFile of collectFiles(sourceHooksDir)) {
        const relativePath = relativePosix(sourceHooksDir, sourceFile);
        const targetFile = path.join(targetInfo.hooksDir, relativePath);
        plan.push(planEntryForFile(sourceFile, targetFile, targetInfo, installedState, forceManaged));
      }
    }
  }

  const standaloneTargets = [
    { sourceFile: path.join(sourceRoot, 'wefidevkits.json'), targetFile: targetInfo.configFile },
    { sourceFile: path.join(sourceRoot, 'settings.wefidevkits.json'), targetFile: targetInfo.settingsSnippetFile }
  ].filter((entry) => entry.sourceFile && entry.targetFile && fs.existsSync(entry.sourceFile));

  for (const entry of standaloneTargets) {
    plan.push(planEntryForFile(entry.sourceFile, entry.targetFile, targetInfo, installedState, forceManaged));
  }

  const installedVersion = installedState?.installedVersion || 'not-installed';
  const conflicts = plan.filter((item) => item.action === 'conflict');
  return { plan, installedVersion, conflicts };
}

function printPlan(planResult, releaseInfo, targetInfo) {
  console.log(`Update target: ${targetInfo.rootDir}`);
  console.log(`Installed version: ${planResult.installedVersion}`);
  console.log(`Available version: ${releaseInfo.version}`);
  console.log('');
  console.log('Files:');
  for (const item of planResult.plan) {
    const suffix = item.reason ? ` (${item.reason})` : '';
    console.log(`- ${item.action}: ${item.targetFile}${suffix}`);
  }
}

function applyPlan(sourceRoot, scriptsRoot, targetInfo, planResult, gitCommitMode) {
  if (planResult.conflicts.length > 0) {
    throw new Error('update has conflicts; rerun with --dry-run and resolve local modifications before applying');
  }

  let changed = 0;
  for (const item of planResult.plan) {
    if (item.action === 'keep') {
      continue;
    }
    if (copyFileIfChanged(item.sourceFile, item.targetFile)) {
      changed += 1;
    }
  }

  if (targetInfo.targetType === 'project') {
    const sourceSettingsFile = path.join(sourceRoot, 'settings.wefidevkits.json');
    applyProjectSettings(sourceSettingsFile, targetInfo);
  }

  installUpdaterRuntime(scriptsRoot, targetInfo);

  if (gitCommitMode) {
    writeWefiConfig(targetInfo.configFile, { gitCommit: { mode: gitCommitMode } });
  }

  return changed;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const gitCommitMode = normalizeGitCommitMode(options.gitCommitMode);
  const targetInfo = getTargetInfo(options.target, options.projectDir);
  const installedState = readInstalledState(targetInfo);
  if (!options.repoProvided && installedState?.release?.repository) {
    options.repo = installedState.release.repository;
  }
  const releaseInfo = await ensureReleaseWorkspace(options, targetInfo);

  if (options.check) {
    const installedVersion = installedState?.installedVersion || 'not-installed';
    console.log(`Installed version: ${installedVersion}`);
    console.log(`Latest available version: ${releaseInfo.version}`);
    console.log(installedVersion === releaseInfo.version ? 'No update available.' : 'Update available.');
    return;
  }

  const planResult = buildPlan(releaseInfo.buildRoot, targetInfo, installedState, options.forceManaged);
  printPlan(planResult, releaseInfo, targetInfo);

  if (options.dryRun) {
    console.log('');
    console.log('Dry run only. No files were changed.');
    return;
  }

  const changedCount = applyPlan(releaseInfo.buildRoot, releaseInfo.scriptsRoot, targetInfo, planResult, gitCommitMode);
  const nextState = buildInstallState(targetInfo, releaseInfo);
  writeJsonFile(targetInfo.stateFile, nextState);

  console.log('');
  console.log(`Applied update from ${releaseInfo.source === 'local-build' ? 'local build' : releaseInfo.tag}.`);
  console.log(`Changed files: ${changedCount}`);
  console.log(`Install state written to ${targetInfo.stateFile}`);
  console.log(`Local updater: ${path.join(getUpdaterRuntimeInfo(targetInfo).binDir, 'wefidevkits-update')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
