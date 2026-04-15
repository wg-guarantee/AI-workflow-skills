# WeFiDevKits Update Feature Design

## Goal

Make `wefidevkits` updates faster, safer, and easier to operate than the current full rebuild plus full reinstall flow.

The primary distribution path should be:

1. maintainer publishes a new GitHub release
2. user runs a local `update` command
3. local updater fetches release metadata and assets from GitHub
4. updater previews, verifies, and applies the update

The design target is not only "install the latest files", but also:

- detect what is already installed
- update only what changed
- preserve user and project-local customization
- produce a clear preview before mutating files
- support GitHub release driven updates as the default path
- keep local-source update as a developer fallback

## Current State

Today the update path is effectively:

1. `npm run build`
2. run `scripts/install-claude.mjs`
3. copy generated files into `~/.claude/skills` or `<project>/.claude/...`
4. merge `settings.json` hooks at install time

This works for first install, but update efficiency is weak because:

- there is no explicit `update` command
- there is no install state file that records what version was installed
- the installer does not know which files are managed by `wefidevkits`
- updates are copy-based rather than diff-based
- there is no dry-run preview
- there is no first-class remote release channel
- there is no authenticated, checksum-verified download path from GitHub releases
- there is no compatibility check between an installed target and the new bundle

## Primary User Flows

### User-Scoped Update

Update globally installed skills for the current user:

```bash
npm run update:user
```

or:

```bash
node scripts/update-claude.mjs --target user
```

### Project-Scoped Update

Update a project that already has `.claude/wefidevkits.json`:

```bash
npm run update:project -- --project-dir /path/to/project
```

### Preview Mode

Show what will change without mutating files:

```bash
npm run update:project -- --project-dir /path/to/project --dry-run
```

### Force / Repair Mode

Reinstall managed files even when the installed state looks inconsistent:

```bash
npm run update:project -- --project-dir /path/to/project --repair
```

### Pin To A Specific Release

Update to a specific GitHub release tag:

```bash
npm run update:project -- --project-dir /path/to/project --version v0.2.0
```

### Check Only

Check whether a new release is available without downloading assets:

```bash
node scripts/update-claude.mjs --target project --project-dir /path/to/project --check
```

## Design Overview

Introduce an explicit update engine with four layers:

1. `release metadata`
2. `source manifest`
3. `installed state`
4. `update planner + applier`

### 1. Release Metadata

GitHub release is the primary update source.

The updater should query:

- latest release
- a specified release tag
- a release channel if channels are added later

Expected GitHub release assets:

- `wefidevkits-claude-code-vX.Y.Z.tar.gz`
- `wefidevkits-claude-code-vX.Y.Z.sha256.txt`
- optional `release-manifest.json`

Recommended release metadata model:

```json
{
  "repository": "owner/wefidevkits",
  "tag": "v0.2.0",
  "version": "0.2.0",
  "publishedAt": "2026-04-15T00:00:00.000Z",
  "assets": {
    "claudeBundle": {
      "name": "wefidevkits-claude-code-v0.2.0.tar.gz",
      "url": "https://github.com/owner/wefidevkits/releases/download/v0.2.0/wefidevkits-claude-code-v0.2.0.tar.gz",
      "sha256Url": "https://github.com/owner/wefidevkits/releases/download/v0.2.0/wefidevkits-claude-code-v0.2.0.sha256.txt"
    }
  }
}
```

Updater responsibilities at this layer:

- resolve latest version or requested tag
- compare remote version against installed version
- download only when an update is needed
- verify downloaded asset checksum before unpacking

This release-first layer is what turns local update into a real self-update feature instead of a local reinstall helper.

### 2. Source Manifest

Extend build output with a deterministic manifest for each host.

Example output:

```text
build/claude/update-manifest.json
build/codex/update-manifest.json
```

Example structure:

```json
{
  "packageName": "wefidevkits",
  "packageVersion": "0.2.0",
  "host": "claude",
  "generatedAt": "2026-04-15T00:00:00.000Z",
  "schemaVersion": 1,
  "files": [
    {
      "source": "skills/wefi-intake/SKILL.md",
      "logicalTarget": "skills/wefi-intake/SKILL.md",
      "sha256": "..."
    },
    {
      "source": "hooks/wefi-session-start.sh",
      "logicalTarget": "hooks/wefi-session-start.sh",
      "sha256": "..."
    }
  ],
  "settingsFragment": {
    "hooks": {
      "SessionStart": [],
      "Stop": [],
      "PreToolUse": []
    }
  },
  "compatibility": {
    "minInstallerSchema": 1,
    "supportedTargets": ["user", "project"]
  }
}
```

Purpose:

- support exact file-level diffing
- let updater know which files it owns
- separate source state from target state
- travel inside the published release asset so the updater can plan updates offline after download

### 3. Installed State

Write a state file into each managed target after install or update.

User target:

```text
~/.claude/wefidevkits/install-state.json
```

Project target:

```text
<project>/.claude/wefidevkits/install-state.json
```

Example structure:

```json
{
  "packageName": "wefidevkits",
  "host": "claude",
  "targetType": "project",
  "installedVersion": "0.1.0",
  "installSchemaVersion": 1,
  "installedAt": "2026-04-15T00:00:00.000Z",
  "managedFiles": [
    {
      "path": ".claude/skills/wefi-intake/SKILL.md",
      "sha256": "...",
      "logicalTarget": "skills/wefi-intake/SKILL.md"
    }
  ],
  "settingsMerge": {
    "managedHookMatchers": {
      "SessionStart": ["*"],
      "Stop": ["*"],
      "PreToolUse": ["Bash(git commit:*)"]
    },
    "settingsSnippetPath": ".claude/settings.wefidevkits.json",
    "backupPath": ".claude/settings.backup.before-wefidevkits.json"
  },
  "preservedConfig": {
    "gitCommitMode": "confirm-each"
  }
}
```

Purpose:

- determine whether the target is already managed
- compare old and new versions without scanning the whole target blindly
- distinguish `wefidevkits` files from user-owned files
- preserve mutable local config across updates
- remember the release source used for installation

Suggested additional fields:

```json
{
  "release": {
    "repository": "owner/wefidevkits",
    "tag": "v0.1.0",
    "channel": "stable"
  }
}
```

### 4. Update Planner And Applier

Add a dedicated script:

```text
wefidevkits/scripts/update-claude.mjs
```

Responsibilities:

- query GitHub release metadata or use a pinned tag
- download release assets into a cache directory
- verify checksum
- unpack the bundle into a temp workspace
- load source manifest from unpacked bundle or local build output
- detect existing target state
- compute file diffs:
  - add new files
  - update changed managed files
  - leave unchanged files alone
  - optionally warn on managed files modified by the user
- reconcile hook/settings fragments without duplicating entries
- update installed state only after a successful apply

The planner should classify changes into:

- `unchanged`
- `safe-update`
- `conflict`
- `orphaned-managed-file`
- `new-managed-file`
- `manual-review-required`

Suggested cache locations:

- user cache: `~/.cache/wefidevkits/releases/`
- project fallback cache: `<project>/.claude/wefidevkits/cache/`

Cached release entries should include:

- downloaded archive
- checksum file
- unpacked manifest
- fetched release JSON

## Efficiency Strategy

### A. Do Not Download Or Recopy Unchanged Versions

If installed version is already equal to the selected release version:

- skip download by default
- allow `--force-download` for repair

If release was already downloaded and checksum-verified in cache:

- reuse cached archive
- skip network fetch

### B. Stop Recopying Unchanged Files

Use per-file hashes from the source manifest and installed state.

If source hash equals installed hash:

- skip copy
- skip chmod
- skip backup

This is the biggest immediate gain for routine updates.

### C. Separate Managed Files From Mutable Config

Current install flow mixes immutable generated assets and mutable project config.

Split them conceptually:

- managed generated assets:
  - skills
  - hook scripts
  - generated settings snippet
- mutable local config:
  - `.claude/wefidevkits.json`
  - existing project `settings.json`

Updater should overwrite managed generated assets, but merge or preserve mutable config.

### D. Use Stable Ownership Markers

Every generated file owned by `wefidevkits` should be either:

- listed in `install-state.json`, or
- stamped with a small header comment where format allows

Examples:

- shell scripts: `# managed-by: wefidevkits`
- markdown/json where acceptable: `"managedBy": "wefidevkits"`

This reduces ambiguity during repair and cleanup.

### E. Do Preview First

Before apply, print a concise plan:

```text
Update target: /path/to/project/.claude
Installed version: 0.1.0
Available version: 0.2.0

Files:
- update: .claude/skills/wefi-intake/SKILL.md
- update: .claude/hooks/wefi-session-start.sh
- add: .claude/skills/wefi-new-skill/SKILL.md
- keep: .claude/wefidevkits.json
- conflict: .claude/settings.json
```

For non-interactive CI-like use, `--json` output can be added later.

### F. Preserve User Edits Intentionally

When a managed file in target was edited after install and no longer matches recorded hash:

- do not silently overwrite
- classify as `conflict`
- offer:
  - `--force-managed`
  - `--backup-conflicts`
  - `--repair`

This matters because hook scripts and settings are likely to be locally tweaked.

## Command Surface

Add to `package.json`:

```json
{
  "scripts": {
    "update:user": "npm run build && node scripts/update-claude.mjs --target user",
    "update:project": "npm run build && node scripts/update-claude.mjs --target project"
  }
}
```

For release-driven usage, the updater should not require `npm run build`.

A better final form is:

```json
{
  "scripts": {
    "update:user": "node scripts/update-claude.mjs --target user",
    "update:project": "node scripts/update-claude.mjs --target project"
  }
}
```

Development-only fallback can remain:

```json
{
  "scripts": {
    "update:user:local": "npm run build && node scripts/update-claude.mjs --target user --from-local-build",
    "update:project:local": "npm run build && node scripts/update-claude.mjs --target project --from-local-build"
  }
}
```

CLI options:

- `--target user|project`
- `--project-dir <path>`
- `--repo <owner/name>`
- `--version <tag-or-version>`
- `--channel <stable|beta>`
- `--check`
- `--dry-run`
- `--repair`
- `--force-managed`
- `--backup-conflicts`
- `--force-download`
- `--from-local-build`
- `--git-commit-mode <mode>`

## GitHub Release Publishing Design

Release publishing should become a first-class part of the maintainer workflow.

Recommended publish flow:

1. bump `package.json` version
2. run `npm run build`
3. run `npm run package:claude:bundle`
4. generate `update-manifest.json`
5. attach bundle and checksum to GitHub release

Recommended GitHub Actions release job responsibilities:

- validate build
- package the Claude bundle
- generate checksums
- create or update GitHub release
- upload release assets

This means update clients only need GitHub access, not repository checkout access.

## Integration With Existing Files

### Build Phase

Update `scripts/generate-skills.mjs` to also emit:

- `build/claude/update-manifest.json`
- `build/codex/update-manifest.json`

This is a low-risk extension because the script already knows every generated skill and support file.

### Install Phase

Update `scripts/install-claude.mjs` so first install and update share the same lower-level primitives:

- `resolveTarget()`
- `loadSourceManifest()`
- `loadInstallState()`
- `planInstallOrUpdate()`
- `applyPlan()`
- `writeInstallState()`

Then:

- fresh install becomes `plan + apply` with no prior state
- update becomes `plan + apply` with prior state

This avoids two diverging codepaths.

### Packaging Phase

Update `scripts/package-claude-distribution.mjs` so bundle output includes:

- `build/claude/update-manifest.json`
- package-level metadata like version and checksum
- optionally `release-manifest.json`

That allows offline apply after the updater downloads the release asset from GitHub.

### Remote Fetch Phase

Add a small fetch layer inside `scripts/update-claude.mjs`:

- resolve GitHub API URL for latest or specific release
- select the correct Claude bundle asset
- download archive and checksum
- verify SHA256
- unpack archive into temp directory

Implementation note:

- use GitHub Releases REST API first
- allow overriding the repository via CLI or config
- support private repositories later via `GITHUB_TOKEN`, but keep initial scope to public releases

## Settings Merge Design

`settings.json` is the highest-risk update surface because it is shared with the host project.

Rules:

1. Never replace the entire file.
2. Only manage the specific hook entries introduced by `wefidevkits`.
3. Record the managed matchers in install state.
4. On update:
   - replace only those managed entries
   - preserve non-managed hook entries untouched
   - preserve unrelated project settings untouched

This is stricter than the current append-or-merge behavior and prevents hook drift.

## Backward Compatibility

The updater should handle three target states:

1. clean install with no prior `wefidevkits`
2. old install without `install-state.json`
3. new install with `install-state.json`

For old installs without state:

- run a one-time migration mode
- infer ownership from known file paths and settings snippet names
- write new `install-state.json`
- warn if ambiguous local modifications are found

This is necessary or the update feature will only help fresh adopters.

For legacy installs that were done from local source instead of GitHub release:

- record `release.repository` on first successful update
- record the fetched version and tag into install state
- switch the target into release-managed mode after migration

## Rollout Plan

### Phase 1

Add GitHub-aware metadata and check-only flow.

- emit `update-manifest.json`
- resolve latest GitHub release
- add `--check`
- add `update-claude.mjs --dry-run`
- detect current installed version
- print file diff plan

### Phase 2

Enable download, verification, and safe file updates for managed assets.

- download release asset from GitHub
- verify checksum
- update unchanged/add/update logic
- write install state
- preserve mutable config

### Phase 3

Handle migration and conflict workflows.

- migrate legacy installs
- add repair mode
- add local-build fallback for developer workflows
- add optional channels like `stable` and `beta`

## Why This Makes Updates Efficient

This design improves efficiency in five concrete ways:

- GitHub release lookup removes manual bundle distribution work for users
- file hashing avoids rewriting unchanged artifacts
- installed state avoids rescanning and guesswork
- settings ownership tracking reduces merge noise and accidental duplication
- explicit update command removes the manual "find release, unpack, reinstall" overhead

The result is not just faster runtime. It also reduces operator hesitation, because users can preview and trust what an update will touch.

## Recommended First Implementation Slice

If implementation needs to stay small, start here:

1. emit `build/claude/update-manifest.json`
2. add `scripts/update-claude.mjs`
3. support GitHub latest release lookup
4. support `--check` and `--dry-run`
5. support project target only
6. write `.claude/wefidevkits/install-state.json`
7. update managed `skills/` and `hooks/`, but only preserve `wefidevkits.json` and merge `settings.json`

That slice is enough to prove the design without refactoring the whole installer stack in one go.
