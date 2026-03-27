# wefidevkits

`wefidevkits` is a workflow-first skills kit for agentic software development, built primarily for Claude Code and also generated for Codex.

The design combines two ideas:

- `superpowers` style workflow routing and session bootstrap
- `gstack` style source templates plus host-specific build output

## Claude Code Alignment

Claude Code skills are emitted as native skill folders under `.claude/skills/<skill>/SKILL.md`, with Claude-compatible frontmatter fields only. Source templates in `skills-src/` can keep extra internal metadata, but the Claude build strips unsupported fields and maps each skill to Claude-native fields such as:

- `name`
- `description`
- `argument-hint`
- `allowed-tools`

This follows the current Claude Code skills and hooks model:

- Skills live under `.claude/skills`
- Hooks can be configured in project settings or in skill frontmatter
- `SessionStart` hooks can inject `additionalContext`

References:

- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/hooks

## What Was Borrowed From superpowers

`wefidevkits` does not copy `superpowers` one-to-one, but it keeps the most useful embedding mechanism:

- project-level `SessionStart` hook injection
- workflow-first routing through a root intake skill
- early session bias toward process skills before ad hoc implementation

Current scope is intentionally narrow:

- enabled: `SessionStart` hook that injects `wefi-intake`
- enabled: `Stop` soft reminder that nudges completion claims back through `wefi-exit-check`
- enabled: `PreToolUse` commit control for `git commit` through a project policy file
- enabled: daily observation logging for user issues, residual concerns, and workflow optimization hints
- not enabled: aggressive pre-submit or pre-tool blocking hooks
- reason: Claude Code hook enforcement is powerful, but commit-blocking or tool-blocking hooks need a safe unlock path or they will create unnecessary friction

## Current Skills

- `wefi-intake`
- `wefi-scope`
- `wefi-sequence`
- `wefi-execute`
- `wefi-review-loop`
- `wefi-root-trace`
- `wefi-commit-gate`
- `wefi-exit-check`

## Workflow Shape

`wefi-intake -> wefi-scope -> wefi-sequence -> wefi-execute | wefi-review-loop -> wefi-commit-gate -> wefi-exit-check`

Debugging routes through `wefi-root-trace` before returning to `wefi-exit-check`.

## Repository Layout

```text
wefidevkits/
├── skills-src/                     # Source skill templates with internal metadata
├── shared/                         # Shared preludes, schemas, host templates
│   └── claude/                     # Claude settings and hook templates
├── adapters/                       # Host capability metadata
├── scripts/                        # Generator, validator, Claude installer
└── build/
    ├── claude/
    │   ├── skills/                 # Claude-native generated skills
    │   ├── hooks/                  # Project hook scripts
    │   ├── settings.wefidevkits.json
    │   └── project-template/.claude/
    └── codex/
```

## Build

```bash
npm run build
```

This generates host output and validates the source templates.

## Install In Claude Code

### 1. User-level install

Install only the reusable skills into `~/.claude/skills`:

```bash
npm run build
npm run install:claude:user
```

This is the lightest installation mode. It makes the skills available globally, but it does not install project hooks.

### 2. Project-level install

Install skills plus the `SessionStart` hook into a specific repository:

```bash
npm run build
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project
```

This copies:

- skills to `/path/to/your/project/.claude/skills`
- hook scripts to `/path/to/your/project/.claude/hooks`
- a settings file or settings snippet into `/path/to/your/project/.claude`
- a workflow policy file at `/path/to/your/project/.claude/wefidevkits.json`

If `.claude/settings.json` does not already exist, the installer writes a ready-to-use settings file.

If `.claude/settings.json` already exists, the installer preserves it and writes:

- `.claude/settings.wefidevkits.json`

In that case, merge the `hooks.SessionStart` entry from the snippet into your existing `.claude/settings.json`.

You can also choose the git commit control mode during install:

```bash
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode confirm-each
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode skill-governed
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode auto
```

Available modes:

- `confirm-each`: every `git commit` is blocked until Claude asks the user and then reruns the commit with explicit approval metadata
- `skill-governed`: rely on `wefi-commit-gate` workflow guidance without a hard hook block
- `auto`: allow autonomous `git commit` execution

You can change the mode later without reinstalling:

```bash
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode confirm-each
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode skill-governed
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode auto
```

The policy file lives at:

```text
/path/to/your/project/.claude/wefidevkits.json
```

The same config file also controls daily learning capture. By default it is enabled and writes observation files to:

```text
/path/to/your/project/.claude/wefidevkits/daily/
```

Each day can produce:

- `YYYY-MM-DD.jsonl`: structured records for issues, concerns, and optimization suggestions
- `YYYY-MM-DD.md`: readable daily summary

By default, the logger only records user problems that were stated explicitly, for example messages containing phrases like:

- `遇到问题`
- `报错`
- `需要关注`
- `记录一下`
- `problem`
- `issue`
- `bug`
- `needs attention`

If you want to disable the daily learning log for a project, edit `.claude/wefidevkits.json` and set:

```json
{
  "learning": {
    "enabled": false
  }
}
```

If you want the logger to capture broader user problem signals instead of only explicit mentions, set:

```json
{
  "learning": {
    "recordExplicitUserIssuesOnly": false
  }
}
```

## Plugin-Style Distribution

To stay close to the `superpowers` repository shape, this repo now also includes root plugin metadata in:

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

Those files describe the repository itself as a Claude-oriented plugin source. They do not replace the official skill layout under `.claude/skills`; they package and describe it.

If you want a ready-to-share bundle that already contains the generated `.claude` tree, run:

```bash
npm run build
npm run package:claude-plugin
```

This creates:

- `build/claude-plugin/wefidevkits/.claude-plugin`
- `build/claude-plugin/wefidevkits/.claude/skills`
- `build/claude-plugin/wefidevkits/.claude/hooks`
- `build/claude-plugin/wefidevkits/.claude/settings.json`

That bundle is useful when you want to hand off a prebuilt package instead of asking users to run the generator first.

## Embedded Claude Hook Behavior

The generated project settings register three low-noise hook lanes:

- `SessionStart` runs `.claude/hooks/wefi-session-start.sh`, reads the installed `wefi-intake` skill, and returns `additionalContext` so Claude Code starts each session with the workflow routing layer already loaded.
- `Stop` runs `.claude/hooks/wefi-stop-review.sh` and issues a soft `systemMessage` reminder when Claude appears to be ending on an unqualified success or commit claim.
- `Stop` also runs `.claude/hooks/wefi-daily-learning.sh`, which writes one deduplicated session observation into the day's learning log when user issues or follow-up concerns were detected.
- `PreToolUse` runs `.claude/hooks/wefi-commit-control.sh` for `Bash` calls and enforces the configured `gitCommit.mode` policy for `git commit`.

That gives `wefidevkits` a Claude-native equivalent to the `superpowers` startup bootstrap plus a lightweight completion guard and a per-day self-improvement memory, without forcing hard-stop tool interception.

## Useful Commands

```bash
node scripts/generate-skills.mjs
node scripts/validate-skills.mjs
npm run install:claude:user
node scripts/install-claude.mjs --target project --project-dir /path/to/project
npm run set:claude:commit-mode -- --project-dir /path/to/project --mode confirm-each
npm run package:claude-plugin
```
