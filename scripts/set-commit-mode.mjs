import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
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

function parseArgs(argv) {
  const options = {
    projectDir: process.cwd(),
    mode: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--project-dir') {
      options.projectDir = argv[index + 1] || options.projectDir;
      index += 1;
      continue;
    }
    if (arg === '--mode') {
      options.mode = argv[index + 1] || options.mode;
      index += 1;
    }
  }

  return options;
}

function normalizeMode(mode) {
  if (mode === 'confirm-each' || mode === 'skill-governed' || mode === 'auto') {
    return mode;
  }
  return null;
}

const options = parseArgs(process.argv.slice(2));
const normalizedMode = normalizeMode(options.mode);

if (!normalizedMode) {
  console.error('Unsupported or missing mode. Use one of: confirm-each, skill-governed, auto.');
  process.exit(1);
}

const targetFile = path.join(path.resolve(options.projectDir), '.claude', 'wefidevkits.json');
const existing = readJsonFile(targetFile);
const config = {
  ...existing,
  gitCommit: {
    ...(existing.gitCommit || {}),
    mode: normalizedMode
  },
  learning: {
    ...(existing.learning || {})
  }
};

ensureDir(path.dirname(targetFile));
fs.writeFileSync(targetFile, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Set git commit mode to ${normalizedMode} in ${targetFile}`);
