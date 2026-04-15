import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const HOSTS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'adapters/common/host-capabilities.json'), 'utf8')
);

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const CLAUDE_SKILL_OVERRIDES = {
  'wefi-intake': {
    allowedTools: ['Read', 'Grep', 'Glob', 'LS']
  },
  'wefi-scope': {
    argumentHint: '[topic]',
    allowedTools: ['Read', 'Grep', 'Glob', 'LS', 'Write', 'Edit', 'MultiEdit']
  },
  'wefi-sequence': {
    argumentHint: '[topic]',
    allowedTools: ['Read', 'Grep', 'Glob', 'LS', 'Write', 'Edit', 'MultiEdit', 'TodoWrite']
  },
  'wefi-execute': {
    argumentHint: '[plan-file]',
    allowedTools: ['Read', 'Grep', 'Glob', 'LS', 'Write', 'Edit', 'MultiEdit', 'Bash', 'TodoWrite']
  },
  'wefi-review-loop': {
    argumentHint: '[plan-file]',
    allowedTools: [
      'Read',
      'Grep',
      'Glob',
      'LS',
      'Write',
      'Edit',
      'MultiEdit',
      'Bash',
      'Task',
      'TodoWrite'
    ]
  },
  'wefi-root-trace': {
    argumentHint: '[symptom]',
    allowedTools: ['Read', 'Grep', 'Glob', 'LS', 'Write', 'Edit', 'MultiEdit', 'Bash']
  },
  'wefi-commit-gate': {
    argumentHint: '[commit-message]',
    allowedTools: ['Read', 'Grep', 'Glob', 'LS', 'Bash']
  },
  'wefi-exit-check': {
    argumentHint: '[claim]',
    allowedTools: ['Read', 'Grep', 'Glob', 'LS', 'Bash']
  }
};

const skillDirs = fs
  .readdirSync(path.join(ROOT, 'skills-src'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
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

function parseArray(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return [];
  }

  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }

  return inner
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^['"]|['"]$/g, ''));
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value.replace(/^['"]|['"]$/g, '');
}

function splitFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error('missing frontmatter');
  }

  return {
    raw: match[1],
    body: content.slice(match[0].length)
  };
}

function parseFrontmatter(content) {
  const { raw } = splitFrontmatter(content);
  const data = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf(':');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    data[key] = value.startsWith('[') ? parseArray(value) : parseScalar(value);
  }

  return data;
}

function parseFrontmatterName(content) {
  const fm = parseFrontmatter(content);
  if (!fm.name) {
    throw new Error("frontmatter missing 'name'");
  }
  return fm.name;
}

function yamlString(value) {
  return JSON.stringify(value);
}

function buildClaudeSkill(rendered) {
  const sourceFrontmatter = parseFrontmatter(rendered);
  const { body } = splitFrontmatter(rendered);
  const override = CLAUDE_SKILL_OVERRIDES[sourceFrontmatter.name] || {};
  const lines = ['---', `name: ${sourceFrontmatter.name}`];

  if (sourceFrontmatter.description) {
    lines.push(`description: ${yamlString(sourceFrontmatter.description)}`);
  }

  if (override.argumentHint) {
    lines.push(`argument-hint: ${yamlString(override.argumentHint)}`);
  }

  if (override.disableModelInvocation !== undefined) {
    lines.push(`disable-model-invocation: ${override.disableModelInvocation}`);
  }

  if (override.userInvocable !== undefined) {
    lines.push(`user-invocable: ${override.userInvocable}`);
  }

  if (override.allowedTools && override.allowedTools.length > 0) {
    lines.push(`allowed-tools: ${yamlString(override.allowedTools.join(', '))}`);
  }

  if (override.paths && override.paths.length > 0) {
    lines.push(`paths: ${yamlString(override.paths.join(', '))}`);
  }

  lines.push('---', '', body);
  return lines.join('\n');
}

function buildClaudeSupportFiles(hostBuildRoot) {
  const hooksRoot = path.join(hostBuildRoot, 'hooks');
  ensureDir(hooksRoot);

  const sessionStartScript = renderTemplate(read('shared/claude/wefi-session-start.sh.tmpl'), {
    INTAKE_SKILL_NAME: 'wefi-intake'
  });
  fs.writeFileSync(path.join(hooksRoot, 'wefi-session-start.sh'), sessionStartScript, {
    mode: 0o755
  });

  const stopReviewScript = read('shared/claude/wefi-stop-review.sh.tmpl');
  fs.writeFileSync(path.join(hooksRoot, 'wefi-stop-review.sh'), stopReviewScript, {
    mode: 0o755
  });

  const dailyLearningScript = read('shared/claude/wefi-daily-learning.sh.tmpl');
  fs.writeFileSync(path.join(hooksRoot, 'wefi-daily-learning.sh'), dailyLearningScript, {
    mode: 0o755
  });

  const commitControlScript = read('shared/claude/wefi-commit-control.sh.tmpl');
  fs.writeFileSync(path.join(hooksRoot, 'wefi-commit-control.sh'), commitControlScript, {
    mode: 0o755
  });

  const settingsTemplate = read('shared/claude/settings.wefidevkits.json.tmpl');
  fs.writeFileSync(
    path.join(hostBuildRoot, 'settings.wefidevkits.json'),
    `${settingsTemplate}\n`
  );

  const configTemplate = read('shared/claude/wefidevkits.json.tmpl');
  fs.writeFileSync(path.join(hostBuildRoot, 'wefidevkits.json'), `${configTemplate}\n`);

  const projectBundleRoot = path.join(hostBuildRoot, 'project-template', '.claude');
  const projectSkillsRoot = path.join(projectBundleRoot, 'skills');
  const projectHooksRoot = path.join(projectBundleRoot, 'hooks');
  ensureDir(projectSkillsRoot);
  ensureDir(projectHooksRoot);
  fs.copyFileSync(
    path.join(hostBuildRoot, 'settings.wefidevkits.json'),
    path.join(projectBundleRoot, 'settings.json')
  );
  fs.copyFileSync(
    path.join(hooksRoot, 'wefi-session-start.sh'),
    path.join(projectHooksRoot, 'wefi-session-start.sh')
  );
  fs.copyFileSync(
    path.join(hooksRoot, 'wefi-stop-review.sh'),
    path.join(projectHooksRoot, 'wefi-stop-review.sh')
  );
  fs.copyFileSync(
    path.join(hooksRoot, 'wefi-daily-learning.sh'),
    path.join(projectHooksRoot, 'wefi-daily-learning.sh')
  );
  fs.copyFileSync(
    path.join(hooksRoot, 'wefi-commit-control.sh'),
    path.join(projectHooksRoot, 'wefi-commit-control.sh')
  );
  fs.copyFileSync(
    path.join(hostBuildRoot, 'wefidevkits.json'),
    path.join(projectBundleRoot, 'wefidevkits.json')
  );
  return { projectSkillsRoot };
}

function copyBundledResources(sourceDir, targetDir) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'SKILL.md.tmpl') {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      ensureDir(targetPath);
      copyBundledResources(sourcePath, targetPath);
      continue;
    }

    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function collectFiles(baseDir, currentDir = baseDir) {
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

function relativePosix(baseDir, fullPath) {
  return path.relative(baseDir, fullPath).split(path.sep).join('/');
}

function buildUpdateManifest(hostBuildRoot, hostKey, packageVersion) {
  const files = [];
  const includeRoots = [
    { sourceDir: path.join(hostBuildRoot, 'skills'), logicalPrefix: 'skills' },
    { sourceDir: path.join(hostBuildRoot, 'hooks'), logicalPrefix: 'hooks' },
    { sourceDir: path.join(hostBuildRoot, 'project-template'), logicalPrefix: 'project-template' }
  ];

  for (const includeRoot of includeRoots) {
    if (!fs.existsSync(includeRoot.sourceDir)) {
      continue;
    }

    for (const fullPath of collectFiles(includeRoot.sourceDir)) {
      const relativePath = relativePosix(includeRoot.sourceDir, fullPath);
      files.push({
        source: relativePosix(hostBuildRoot, fullPath),
        logicalTarget: `${includeRoot.logicalPrefix}/${relativePath}`,
        sha256: sha256File(fullPath)
      });
    }
  }

  const standaloneFiles = [
    'bootstrap.md',
    'manifest.json',
    'settings.wefidevkits.json',
    'wefidevkits.json'
  ];

  for (const fileName of standaloneFiles) {
    const fullPath = path.join(hostBuildRoot, fileName);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    files.push({
      source: relativePosix(hostBuildRoot, fullPath),
      logicalTarget: fileName,
      sha256: sha256File(fullPath)
    });
  }

  return {
    packageName: 'wefidevkits',
    packageVersion,
    host: hostKey,
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    files
  };
}

const sharedPreludeTemplate = read('shared/shared-prelude.md.tmpl');
const bootstrapTemplate = read('shared/bootstrap.md.tmpl');
const packageMeta = JSON.parse(read('package.json'));
const packageVersion = packageMeta.version || '0.0.0';

const buildRoot = path.join(ROOT, 'build');
cleanDir(buildRoot);

for (const [hostKey, host] of Object.entries(HOSTS)) {
  const hostBuildRoot = path.join(buildRoot, hostKey);
  const hostSkillsRoot = path.join(hostBuildRoot, 'skills');
  let projectSkillsMirrorRoot = null;
  ensureDir(hostSkillsRoot);
  if (hostKey === 'claude') {
    const claudeSupport = buildClaudeSupportFiles(hostBuildRoot);
    projectSkillsMirrorRoot = claudeSupport.projectSkillsRoot;
  }

  const toolMapping = read(`shared/tool-mappings/${host.toolMapKey}.md`);
  const sharedPrelude = renderTemplate(sharedPreludeTemplate, {
    HOST_TOOL_MAPPING: toolMapping
  });

  const bootstrap = renderTemplate(bootstrapTemplate, {
    HOST_NAME: host.displayName,
    HOST_HAS_SESSION_BOOTSTRAP: String(host.hasSessionBootstrap)
  });

  fs.writeFileSync(path.join(hostBuildRoot, 'bootstrap.md'), bootstrap);

  const manifest = {
    host: hostKey,
    generatedAt: new Date().toISOString(),
    skills: []
  };

  for (const skillName of skillDirs) {
    const template = read(`skills-src/${skillName}/SKILL.md.tmpl`);
    const renderedSource = renderTemplate(template, {
      SHARED_PRELUDE: sharedPrelude,
      HOST_NAME: host.displayName
    });
    const rendered = hostKey === 'claude' ? buildClaudeSkill(renderedSource) : renderedSource;
    const outputSkillName = parseFrontmatterName(rendered);
    const targetDir = path.join(hostSkillsRoot, outputSkillName);
    ensureDir(targetDir);
    fs.writeFileSync(path.join(targetDir, 'SKILL.md'), rendered);
    copyBundledResources(path.join(ROOT, 'skills-src', skillName), targetDir);
    if (projectSkillsMirrorRoot) {
      copyDir(targetDir, path.join(projectSkillsMirrorRoot, outputSkillName));
    }
    manifest.skills.push(outputSkillName);
  }

  fs.writeFileSync(
    path.join(hostBuildRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const updateManifest = buildUpdateManifest(hostBuildRoot, hostKey, packageVersion);
  fs.writeFileSync(
    path.join(hostBuildRoot, 'update-manifest.json'),
    `${JSON.stringify(updateManifest, null, 2)}\n`
  );
}

console.log(`Generated ${skillDirs.length} skills for ${Object.keys(HOSTS).length} hosts.`);
