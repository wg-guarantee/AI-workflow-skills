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
├── references/                    # Design baselines and reference docs
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

## 金融级设计约束

如果项目涉及资金、余额、结算、支付请求、限额、对账或监管留痕，不应只按普通业务系统标准设计。

`wefidevkits` 现在内置一套金融级设计基线，覆盖：

- 事务与原子性
- 幂等与防重
- 防篡改与数据完整性
- 审计与全链路追踪
- 资金安全控制

详细基线见：

`references/financial-grade-design.md`

这些约束已经嵌入到 `wefi-scope`、`wefi-sequence`、`wefi-execute`、`wefi-root-trace`、`wefi-exit-check` 的流程要求里。对金融类任务，设计、计划、实现、排障、验收都必须显式检查这些项，而不是靠口头约定。

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

## 已安装后的更新方式

更新不需要先卸载，直接重新构建并覆盖安装即可。

### 1. 拉取最新代码

注意：`git pull` 只会更新“当前所在 Git 仓库”的代码，不会自动更新另一个仓库。

例如：

- 如果你在业务项目目录里执行 `git pull`，更新的是业务项目本身，例如 `HybridRag`
- 如果你在本 skills 仓库目录里执行 `git pull`，更新的才是 `wefidevkits`

因此，更新 `wefidevkits` 时，应先进入本仓库根目录，再进入 `wefidevkits/` 子目录构建：

```bash
cd /path/to/AI-workflow-skills
git pull
cd wefidevkits
npm run build
```

如果你只是在某个已安装了 skill 的业务项目目录里执行：

```bash
git pull
```

那只会拉取该业务项目自己的代码，不会更新 `.claude/skills` 里已经安装的 `wefidevkits` 文件。

### 2. 如果之前是全局安装

重新执行：

```bash
npm run install:claude:user
```

这会把最新生成的 skills 覆盖复制到：

```text
~/.claude/skills
```

通常重开一个 Claude Code 会话即可生效。

### 3. 如果之前是项目级安装

重新执行：

```bash
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project
```

这会更新项目里的：

- `.claude/skills`
- `.claude/hooks`

### 4. 关于已有 `.claude/settings.json` 的项目

如果目标项目已经存在：

```text
.claude/settings.json
```

安装器不会直接覆盖它，而是更新：

```text
.claude/settings.wefidevkits.json
```

这时需要把该文件里的 hook 变更手动合并回项目自己的 `.claude/settings.json`。

### 5. 关于配置保留

项目内的：

```text
.claude/wefidevkits.json
```

默认会被保留，因此原有配置通常不会丢失，例如：

- `gitCommit.mode`
- `learning.enabled`
- `learning.recordExplicitUserIssuesOnly`

如果你在更新时显式传入：

```bash
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode confirm-each
```

则会同步改写该项目的 git 提交策略。

### 6. 一个实际注意点

如果你曾经直接修改过已安装目录里的文件，例如项目中的：

- `.claude/skills/...`
- `.claude/hooks/...`

那么重新安装时同名文件会被覆盖。

要保留自定义修改，应修改 `wefidevkits` 源文件后重新构建，而不是长期直接修改安装产物。

## 打包为可分发插件

```bash
npm run build
npm run package:claude-plugin
```

## 仓库中现有技能集合

这个仓库里还保留了若干现有技能集合，主要用于对照分析、复用参考或一起分发：

- `superpowers/`
- `legacy-system-archaeology/`
- `doc2md/`
- `documentation-writer/`
- `flowchart-generator/`
- `frontend-design/`
- `impeccable/`
- `mcp-builder/`

## 常用命令

```bash
node scripts/generate-skills.mjs
node scripts/validate-skills.mjs
npm run install:claude:user
node scripts/install-claude.mjs --target project --project-dir /path/to/project
npm run set:claude:commit-mode -- --project-dir /path/to/project --mode confirm-each
npm run package:claude-plugin
```
