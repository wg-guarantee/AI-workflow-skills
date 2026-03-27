## Host Tool Mapping

Codex-oriented execution should map workflow concepts to local tools:

- native skill discovery or direct skill usage instead of an explicit `Skill` tool
- `spawn_agent` for subagents
- `update_plan` for checklist or plan tracking
- shell, file reads, and file edits through the host's normal toolchain

