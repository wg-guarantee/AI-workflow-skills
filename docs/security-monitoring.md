# Security Monitoring

This repository now includes a pull-request security gate built around GitHub Actions plus repository-tuned scanner configuration.

## What Runs

- `Semgrep` scans the executable JavaScript and TypeScript paths that are most likely to contain AI-authored logic:
  - `wefidevkits/scripts`
  - `flowchart-generator/src`
  - `skill-creating/scripts`
  - `mcp-builder/scripts`
- `Gitleaks` scans the checked-out repository for hard-coded secrets.
- `Trivy` scans the repository filesystem for dependency vulnerabilities and high-risk misconfiguration.

## What Blocks A PR

- Any `Semgrep` finding from either the public JavaScript/Node.js rulesets or the repository-local rules in `.semgrep/wefidevkits.yml`
- Any `Gitleaks` finding outside the allowlisted placeholder and documentation paths in `.gitleaks.toml`
- Any `Trivy` `HIGH` or `CRITICAL` vulnerability or misconfiguration, with `ignore-unfixed` enabled to reduce noise from issues with no published remediation yet

PR blocking becomes effective only after the repository branch protection rules require these GitHub checks:

- `semgrep`
- `gitleaks`
- `trivy`

## Repository-Specific Tuning

The configuration is intentionally strict on executable code and intentionally lighter on documentation and generated output.

- `.semgrep/wefidevkits.yml` adds hard-fail rules for:
  - `eval` and `new Function`
  - shell-based `child_process` execution
  - disabling TLS verification
  - world-writable filesystem permissions
- `.gitleaks.toml` ignores:
  - generated build output
  - documentation and template files that intentionally contain placeholders
  - obvious dummy/example token text
- `Trivy` skips large documentation-heavy directories and generated build output directly from the workflow to keep the signal focused on runnable code and packaging assets

## Recommended Rollout

1. Merge the workflow and configs.
2. Run the workflow on a feature branch and inspect the first round of findings.
3. Tighten or narrow allowlists only when a finding is confirmed to be noise.
4. Enable branch protection on the default branch so failed security jobs block merge.

## Operational Notes

- The workflow runs on `pull_request`, `push` to `main` or `master`, a daily schedule, and manual dispatch.
- SARIF output is uploaded for all three scanners so findings show up in GitHub code scanning.
- This setup is aimed at catching obvious, automatable issues in AI-authored or AI-assisted changes. It does not replace manual review for auth, data isolation, shell execution, or secret-handling changes.
