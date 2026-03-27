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

## 技能能力与用法

### `wefi-intake`

能力：

- 作为会话入口，优先把请求路由到合适的 workflow skill
- 阻止“先随手做、后补流程”的习惯
- 在设计、计划、提交、完成声明之间做流程分诊

适用时机：

- 新开一轮会话
- 用户刚提出开发请求
- 不确定应该先设计、先写计划，还是已经到了提交/验收阶段

典型用法：

- “帮我做一个新功能”
- “这个需求应该先怎么走流程”
- “现在该直接改代码还是先写计划”

### `wefi-scope`

能力：

- 把模糊需求收敛成已批准的设计
- 明确范围、约束、成功标准和方案取舍
- 在金融类任务中补齐事务、幂等、审计、对账等设计约束

适用时机：

- 新功能、行为变更、重构方向还不清晰
- 用户还在讨论方案，不应该直接写代码
- 需要先把设计沉淀成可审批文档

典型用法：

- “分析这个需求并给出两种方案”
- “先不要写代码，先把范围和技术方案定下来”
- “这个支付流程应该怎么设计”

输出：

- `docs/wefidevkits/specs/YYYY-MM-DD-<topic>.md`

### `wefi-sequence`

能力：

- 把已批准的设计转成可执行计划
- 为每一步写清文件、改动内容、测试、验证命令和预期结果
- 让后续执行不需要临场发明细节

适用时机：

- 设计已经通过，但还没进入编码
- 需要把工作拆成有顺序的任务
- 希望把执行过程变成可交接、可审查的计划

典型用法：

- “把这个方案拆成执行步骤”
- “给我一份可以照着做的实施计划”
- “列出要改哪些文件、怎么验证”

输出：

- `docs/wefidevkits/plans/YYYY-MM-DD-<topic>.md`

### `wefi-execute`

能力：

- 按批准过的计划逐步执行
- 跟踪任务状态，避免边做边改需求
- 在金融类实现中强制关注原子性、幂等、流水审计和安全控制

适用时机：

- 已经有了明确的 `wefi-sequence` 计划
- 需要在当前会话里直接实施改动
- 不需要多 agent 审查闭环时

典型用法：

- “按这份计划开始实现”
- “现在进入执行阶段”
- “不要重新设计，直接照计划做”

### `wefi-review-loop`

能力：

- 在支持 subagent 的宿主里，把实现、规格审查、质量审查拆成闭环
- 降低 implementer 自评导致的漏检
- 让每个任务都经过独立 review 再进入下一步

适用时机：

- 已有明确计划
- 任务适合拆成隔离的小块
- 希望在执行时加一层 spec review 和 quality review

典型用法：

- “这个计划用多 agent 模式执行”
- “实现后要先做规格审查再做质量审查”
- “每个任务都要 review 后再算完成”

### `wefi-root-trace`

能力：

- 在修 bug 前先做根因分析
- 追踪故障是在哪个状态转换、数据边界或系统步骤首次变坏
- 避免堆叠式试错修复

适用时机：

- 出现 bug、回归、测试失败、线上异常
- 现象复杂，不能靠“猜一个修一个”
- 金融类问题需要排查重试、状态错转、流水不一致、补偿失败等

典型用法：

- “这个 bug 先别急着修，先查根因”
- “为什么这个接口偶发重复扣款”
- “测试挂了，帮我定位真正原因”

### `wefi-commit-gate`

能力：

- 在提交前应用项目的 git 提交策略
- 汇总变更、验证结果和拟提交 message
- 在 `confirm-each` 模式下要求显式用户确认

适用时机：

- 准备执行 `git commit`
- 用户尚未明确授权提交
- 需要根据项目配置决定是否允许自动提交

典型用法：

- “准备提交这些改动”
- “先总结这次提交内容再问我要不要 commit”
- “按照当前项目的提交策略执行”

### `wefi-exit-check`

能力：

- 在声称“完成了”“修好了”“测试过了”之前要求重新验证
- 把完成状态严格区分为 `DONE`、`DONE_WITH_CONCERNS`、`BLOCKED`、`NEEDS_CONTEXT`
- 对金融类任务额外要求事务安全、幂等和审计证据

适用时机：

- 准备说任务完成
- 准备说 bug 已修复
- 准备提交、交付、合并或结束当前任务

典型用法：

- “先别说完成，先验证”
- “这个修复到底有没有证据支持”
- “给我最终验收结论”

## 工作流关系

```text
wefi-intake -> wefi-scope -> wefi-sequence -> wefi-execute | wefi-review-loop -> wefi-commit-gate -> wefi-exit-check
```

调试问题优先走 `wefi-root-trace`，再回到 `wefi-exit-check` 做最终验证。

## 常见流程示例

### 新功能开发

```text
wefi-intake -> wefi-scope -> wefi-sequence -> wefi-execute -> wefi-commit-gate -> wefi-exit-check
```

### 多 agent 审查式开发

```text
wefi-intake -> wefi-scope -> wefi-sequence -> wefi-review-loop -> wefi-commit-gate -> wefi-exit-check
```

### Bug 排查与修复

```text
wefi-intake -> wefi-root-trace -> wefi-exit-check
```

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

## 分层控制模型

`wefidevkits` 不会默认把所有任务都按金融级标准处理，而是先分类，再按层级施加控制：

- `Tier 0`：普通任务，无敏感写路径
- `Tier 1`：重要业务任务，涉及状态、权限、外部可见行为或数据一致性
- `Tier 2`：金融敏感任务，涉及计费、限额、支付状态、对账输入、风控判断
- `Tier 3`：资金账务任务，直接影响余额、账本、结算、放款、还款、退款等资金结果

如果只有某个子流程涉及 Tier 2 或 Tier 3，skills 会要求只对该子流程提升控制，不把整个任务一刀切升级。

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

这些约束已经嵌入到 `wefi-scope`、`wefi-sequence`、`wefi-execute`、`wefi-review-loop`、`wefi-root-trace`、`wefi-exit-check` 的流程要求里，但只会在 Tier 2 或 Tier 3 任务上提升控制强度。

- Tier 0：普通功能与回归验证
- Tier 1：状态、权限、数据一致性与回归验证
- Tier 2：状态机、重试、副作用、审计、风控/限额验证
- Tier 3：事务、幂等、防篡改、审计、对账、补偿、资金安全验证

## 构建

```bash
npm run build
```

## 安装到 Claude Code

安装已简化为一步式命令，安装脚本会自动先构建再执行复制。

### 全局安装

```bash
npm run install:user
```

### 安装到某个项目

```bash
npm run install:project -- --project-dir /path/to/your/project
```

安装时可直接指定 git 提交模式：

```bash
npm run install:project -- --project-dir /path/to/your/project --git-commit-mode confirm-each
npm run install:project -- --project-dir /path/to/your/project --git-commit-mode skill-governed
npm run install:project -- --project-dir /path/to/your/project --git-commit-mode auto
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
```

如果你只是在某个已安装了 skill 的业务项目目录里执行：

```bash
git pull
```

那只会拉取该业务项目自己的代码，不会更新 `.claude/skills` 里已经安装的 `wefidevkits` 文件。

### 2. 如果之前是全局安装

重新执行：

```bash
npm run install:user
```

这会把最新生成的 skills 覆盖复制到：

```text
~/.claude/skills
```

通常重开一个 Claude Code 会话即可生效。

### 3. 如果之前是项目级安装

重新执行：

```bash
npm run install:project -- --project-dir /path/to/your/project
```

这会更新项目里的：

- `.claude/skills`
- `.claude/hooks`

### 4. 关于已有 `.claude/settings.json` 的项目

如果目标项目已经存在：

```text
.claude/settings.json
```

安装器会自动把 `wefidevkits` 需要的 hooks 合并进现有的：

```text
.claude/settings.json
```

同时会写出两个辅助文件：

```text
.claude/settings.wefidevkits.json
.claude/settings.backup.before-wefidevkits.json
```

其中：

- `settings.wefidevkits.json` 用作参考 snippet
- `settings.backup.before-wefidevkits.json` 是自动合并前的备份

这意味着通常不再需要手工把 snippet 合并回 `settings.json`。

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
npm run install:project -- --project-dir /path/to/your/project --git-commit-mode confirm-each
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
npm run install:user
npm run install:project -- --project-dir /path/to/project
npm run set:claude:commit-mode -- --project-dir /path/to/project --mode confirm-each
npm run package:claude-plugin
```
