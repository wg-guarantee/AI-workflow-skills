#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function resolveSharedSecurityRoot() {
  const repoRelative = path.join(ROOT, 'shared', 'security');
  if (fs.existsSync(repoRelative)) {
    return repoRelative;
  }

  const installedRelative = path.join(__dirname, 'shared', 'security');
  if (fs.existsSync(installedRelative)) {
    return installedRelative;
  }

  throw new Error('unable to locate shared security templates');
}

const SHARED_SECURITY_ROOT = resolveSharedSecurityRoot();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readSecurityTemplate(fileName) {
  return fs.readFileSync(path.join(SHARED_SECURITY_ROOT, fileName), 'utf8');
}

function renderTemplate(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`{{${key}}}`).join(value);
  }
  return output;
}

function parseArgs(argv) {
  const options = {
    projectDir: process.cwd(),
    force: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--project-dir') {
      options.projectDir = argv[index + 1] || options.projectDir;
      index += 1;
      continue;
    }
    if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

function directoryExists(projectDir, relativePath) {
  return fs.existsSync(path.join(projectDir, relativePath)) && fs.statSync(path.join(projectDir, relativePath)).isDirectory();
}

function detectScanPaths(projectDir) {
  const candidates = [
    'src',
    'app',
    'apps',
    'packages',
    'services',
    'server',
    'lib',
    'api',
    'scripts'
  ];

  const found = candidates.filter((candidate) => directoryExists(projectDir, candidate));
  return found.length > 0 ? found : ['.'];
}

function toWorkflowPathFilters(paths) {
  return paths.map((item) => `      - "${item}/**"`).join('\n');
}

function toSemgrepTargets(paths) {
  if (paths.length === 0) {
    return '            .';
  }

  return paths
    .map((item, index) => {
      const suffix = index === paths.length - 1 ? '' : ' \\';
      return `            ${item}${suffix}`;
    })
    .join('\n');
}

function toDetectedPaths(paths) {
  return paths.map((item) => `- \`${item}\``).join('\n');
}

function toTrivySkipDirs(paths) {
  const defaults = [
    '/repo/.git',
    '/repo/node_modules',
    '/repo/build',
    '/repo/dist',
    '/repo/coverage'
  ];
  const deduped = Array.from(new Set(defaults));
  return deduped
    .map((item, index) => {
      const suffix = index === deduped.length - 1 ? '' : ' \\';
      return `            --skip-dirs ${item}${suffix}`;
    })
    .join('\n');
}

function writeFile(targetFile, content, force) {
  if (fs.existsSync(targetFile) && !force) {
    throw new Error(`file already exists: ${targetFile}. Re-run with --force to overwrite.`);
  }
  ensureDir(path.dirname(targetFile));
  fs.writeFileSync(targetFile, content);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectDir = path.resolve(options.projectDir);
  const detectedPaths = detectScanPaths(projectDir);

  const workflowTemplate = readSecurityTemplate('security-pr.yml.tmpl');
  const workflow = renderTemplate(workflowTemplate, {
    PATH_FILTERS: toWorkflowPathFilters(detectedPaths),
    SEMGREP_TARGETS: toSemgrepTargets(detectedPaths),
    TRIVY_SKIP_DIRS: toTrivySkipDirs(detectedPaths)
  });

  const monitoringDoc = renderTemplate(readSecurityTemplate('security-monitoring.md.tmpl'), {
    DETECTED_PATHS: toDetectedPaths(detectedPaths)
  });

  writeFile(path.join(projectDir, '.github', 'workflows', 'security-pr.yml'), `${workflow}\n`, options.force);
  writeFile(path.join(projectDir, '.semgrep', 'wefidevkits.yml'), `${readSecurityTemplate('wefidevkits.yml.tmpl')}\n`, options.force);
  writeFile(path.join(projectDir, '.gitleaks.toml'), `${readSecurityTemplate('gitleaks.toml.tmpl')}\n`, options.force);
  writeFile(path.join(projectDir, 'docs', 'security-monitoring.md'), `${monitoringDoc}\n`, options.force);

  console.log(`Configured security monitoring in ${projectDir}`);
  console.log('Generated files:');
  console.log(`- ${path.join(projectDir, '.github', 'workflows', 'security-pr.yml')}`);
  console.log(`- ${path.join(projectDir, '.semgrep', 'wefidevkits.yml')}`);
  console.log(`- ${path.join(projectDir, '.gitleaks.toml')}`);
  console.log(`- ${path.join(projectDir, 'docs', 'security-monitoring.md')}`);
  console.log('Next step: commit the generated files and set semgrep, gitleaks, and trivy as required GitHub checks.');
}

main();
