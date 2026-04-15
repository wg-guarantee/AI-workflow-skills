import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BUILD_ROOT = path.join(ROOT, 'build');
const CLAUDE_BUILD_ROOT = path.join(BUILD_ROOT, 'claude');
const CLAUDE_PLUGIN_ROOT = path.join(ROOT, '.claude-plugin');
const DIST_ROOT = path.join(BUILD_ROOT, 'distributions');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
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

function renderTemplate(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`{{${key}}}`).join(value);
  }
  return output;
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

if (!fs.existsSync(CLAUDE_BUILD_ROOT)) {
  console.error('Claude build output not found. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(CLAUDE_PLUGIN_ROOT)) {
  console.error('Missing .claude-plugin metadata in repo root.');
  process.exit(1);
}

const packageMeta = JSON.parse(read('package.json'));
const version = packageMeta.version || '0.0.0';
const bundleName = `wefidevkits-claude-code-v${version}`;
const bundleRoot = path.join(DIST_ROOT, bundleName);
const archiveName = `${bundleName}.tar.gz`;
const archivePath = path.join(DIST_ROOT, archiveName);
const checksumPath = path.join(DIST_ROOT, `${bundleName}.sha256.txt`);
const releaseManifestPath = path.join(DIST_ROOT, `${bundleName}.release.json`);

cleanDir(DIST_ROOT);

copyDir(CLAUDE_PLUGIN_ROOT, path.join(bundleRoot, '.claude-plugin'));
copyDir(CLAUDE_BUILD_ROOT, path.join(bundleRoot, 'build', 'claude'));
copyDir(
  path.join(CLAUDE_BUILD_ROOT, 'project-template'),
  path.join(bundleRoot, 'project-template')
);
copyDir(path.join(CLAUDE_BUILD_ROOT, 'skills'), path.join(bundleRoot, 'user-template', 'skills'));
copyDir(path.join(ROOT, 'scripts'), path.join(bundleRoot, 'scripts'));

const installGuide = renderTemplate(read('shared/claude/INSTALL-CLAUDE.md.tmpl'), {
  VERSION: version
});
fs.writeFileSync(path.join(bundleRoot, 'INSTALL-CLAUDE.md'), `${installGuide}\n`);

const distributionPackageJson = renderTemplate(
  read('shared/claude/distribution.package.json.tmpl'),
  {
    VERSION: version
  }
);
fs.writeFileSync(path.join(bundleRoot, 'package.json'), `${distributionPackageJson}\n`);

execFileSync('tar', ['-czf', archiveName, bundleName], {
  cwd: DIST_ROOT,
  stdio: 'inherit'
});

const checksum = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
fs.writeFileSync(checksumPath, `${checksum}  ${archiveName}\n`);

const releaseManifest = {
  packageName: 'wefidevkits',
  version,
  tag: `v${version}`,
  createdAt: new Date().toISOString(),
  assets: {
    claudeBundle: archiveName,
    sha256: path.basename(checksumPath)
  }
};
fs.writeFileSync(releaseManifestPath, `${JSON.stringify(releaseManifest, null, 2)}\n`);

console.log(`Packaged Claude Code distribution folder at ${bundleRoot}`);
console.log(`Packaged Claude Code archive at ${archivePath}`);
console.log(`Wrote SHA256 checksum to ${checksumPath}`);
console.log(`Wrote release manifest to ${releaseManifestPath}`);
