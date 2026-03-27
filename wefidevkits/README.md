# wefidevkits

`wefidevkits` 是一套面向 Claude Code 的 workflow-first skills kit，也保留了面向其他宿主的生成能力。

它融合了两类思路：

- `superpowers` 风格的流程路由与会话启动嵌入
- `gstack` 风格的模板源、schema 和目标宿主构建输出

## 核心目标

- 用 intake skill 把会话先导入标准工作流，而不是直接进入零散实现
- 通过 Claude Code hooks 在 `SessionStart`、`Stop`、`PreToolUse` 植入流程约束
- 提供可配置的 git 提交控制
- 记录用户当天显式提及的问题，形成轻量级自我优化闭环

## 当前技能

- `wefi-intake`
- `wefi-scope`
- `wefi-sequence`
- `wefi-execute`
- `wefi-review-loop`
- `wefi-root-trace`
- `wefi-commit-gate`
- `wefi-exit-check`

## 工作流关系

```text
wefi-intake -> wefi-scope -> wefi-sequence -> wefi-execute | wefi-review-loop -> wefi-commit-gate -> wefi-exit-check
```

调试问题优先走 `wefi-root-trace`，再回到 `wefi-exit-check` 做最终验证。

## 目录结构

```text
wefidevkits/
├── .claude-plugin/                # Claude plugin-style metadata
├── adapters/                      # Host capability metadata
├── scripts/                       # Generator, validator, installer
├── shared/                        # Shared schema, prelude, hook templates
├── skills-src/                    # Source skill templates
└── build/                         # Generated output
```

## Claude Code 集成能力

- `SessionStart`: 注入 `wefi-intake`，让会话从流程入口开始
- `Stop`: 对未经验证的完成声明做软提醒
- `Stop`: 写入当日 learning 记录，只记录用户显式提及的问题或关注项
- `PreToolUse`: 对 `git commit` 执行提交策略控制

## Git 提交策略

- `confirm-each`: 每次 `git commit` 前都要求先获得用户确认
- `skill-governed`: 不做硬阻断，但要求流程经过 `wefi-commit-gate`
- `auto`: 允许自动提交

## 每日学习记录

默认启用，输出到：

```text
.claude/wefidevkits/daily/
```

每天可能生成：

- `YYYY-MM-DD.jsonl`
- `YYYY-MM-DD.md`

默认只记录用户明确表达的问题，例如“遇到问题”“报错”“需要关注”“issue”“bug”。

## 构建

```bash
npm run build
```

## 安装到 Claude Code

### 全局安装

```bash
npm run build
npm run install:claude:user
```

### 安装到某个项目

```bash
npm run build
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project
```

安装时可直接指定 git 提交模式：

```bash
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode confirm-each
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode skill-governed
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode auto
```

后续切换模式：

```bash
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode confirm-each
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode skill-governed
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode auto
```

## 打包为可分发插件

```bash
npm run build
npm run package:claude-plugin
```

## 常用命令

```bash
node scripts/generate-skills.mjs
node scripts/validate-skills.mjs
npm run install:claude:user
node scripts/install-claude.mjs --target project --project-dir /path/to/project
npm run set:claude:commit-mode -- --project-dir /path/to/project --mode confirm-each
npm run package:claude-plugin
```
