import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const schema = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'shared/schemas/skill-frontmatter.schema.json'), 'utf8')
);

const validPhases = new Set(schema.properties.phase.enum);
const validKinds = new Set(schema.properties.kind.enum);
const validStrictness = new Set(schema.properties.strictness.enum);
const validHosts = new Set(schema.properties.supports_hosts.items.enum);

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

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error('missing frontmatter');
  }

  const data = {};
  for (const line of match[1].split('\n')) {
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

    if (value.startsWith('[')) {
      data[key] = parseArray(value);
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  return data;
}

function validateSkill(filePath, expectedName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(content);
  const errors = [];

  for (const requiredField of schema.required) {
    if (!(requiredField in fm)) {
      errors.push(`missing required field '${requiredField}'`);
    }
  }

  if (fm.name && !/^[a-z0-9-]+$/.test(fm.name)) {
    errors.push("field 'name' must match ^[a-z0-9-]+$");
  }

  if (fm.name && fm.name !== expectedName) {
    errors.push(`field 'name' must match directory name '${expectedName}'`);
  }

  if (fm.description && !fm.description.startsWith('Use when')) {
    errors.push("field 'description' should start with 'Use when'");
  }

  if (fm.phase && !validPhases.has(fm.phase)) {
    errors.push(`invalid phase '${fm.phase}'`);
  }

  if (fm.kind && !validKinds.has(fm.kind)) {
    errors.push(`invalid kind '${fm.kind}'`);
  }

  if (fm.strictness && !validStrictness.has(fm.strictness)) {
    errors.push(`invalid strictness '${fm.strictness}'`);
  }

  if (Array.isArray(fm.supports_hosts)) {
    for (const host of fm.supports_hosts) {
      if (!validHosts.has(host)) {
        errors.push(`unsupported host '${host}'`);
      }
    }
  }

  for (const key of ['requires', 'handoff_to', 'allowed_tools']) {
    if (key in fm && !Array.isArray(fm[key])) {
      errors.push(`field '${key}' must be an inline array`);
    }
  }

  return errors;
}

const skillsRoot = path.join(ROOT, 'skills-src');
const skillDirs = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const allErrors = [];

for (const skillName of skillDirs) {
  const filePath = path.join(skillsRoot, skillName, 'SKILL.md.tmpl');
  if (!fs.existsSync(filePath)) {
    allErrors.push(`${skillName}: missing SKILL.md.tmpl`);
    continue;
  }

  const errors = validateSkill(filePath, skillName);
  for (const error of errors) {
    allErrors.push(`${skillName}: ${error}`);
  }
}

if (allErrors.length > 0) {
  console.error('Validation failed:\n');
  for (const error of allErrors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${skillDirs.length} skill templates.`);
