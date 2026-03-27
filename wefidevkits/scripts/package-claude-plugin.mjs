import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CLAUDE_BUILD_ROOT = path.join(ROOT, 'build', 'claude');
const CLAUDE_PLUGIN_ROOT = path.join(ROOT, '.claude-plugin');
const OUTPUT_ROOT = path.join(ROOT, 'build', 'claude-plugin');
const PACKAGE_ROOT = path.join(OUTPUT_ROOT, 'wefidevkits');

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

if (!fs.existsSync(CLAUDE_BUILD_ROOT)) {
  console.error('Claude build output not found. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(CLAUDE_PLUGIN_ROOT)) {
  console.error('Missing .claude-plugin metadata in repo root.');
  process.exit(1);
}

cleanDir(OUTPUT_ROOT);
ensureDir(PACKAGE_ROOT);

copyDir(CLAUDE_PLUGIN_ROOT, path.join(PACKAGE_ROOT, '.claude-plugin'));
copyDir(path.join(CLAUDE_BUILD_ROOT, 'project-template', '.claude'), path.join(PACKAGE_ROOT, '.claude'));

console.log(`Packaged Claude plugin bundle at ${PACKAGE_ROOT}`);
