# AI Workflow Skills

Claude Code 技能集合，用于增强 AI 辅助开发工作流。

当前仓库同时包含两类能力：

- 现有通用技能集合：`superpowers`、`legacy-system-archaeology`、`doc2md`、`documentation-writer` 等
- 新增 workflow-first 技能套件：`wefidevkits`

## 技能列表

### Superpowers

Claude Code 超能力技能集合，提供专业化的开发工作流程支持。

**核心技能**:
- `using-superpowers` - 技能使用指南
- `brainstorming` - 创意头脑风暴
- `systematic-debugging` - 系统化调试
- `test-driven-development` - 测试驱动开发
- `writing-plans` - 编写实现计划
- `writing-skills` - 编写新技能
- `subagent-driven-development` - 子代理驱动开发
- `requesting-code-review` - 请求代码审查
- `receiving-code-review` - 接收代码审查反馈
- `verification-before-completion` - 完成前验证
- `dispatching-parallel-agents` - 并行任务调度
- `executing-plans` - 执行计划
- `finishing-a-development-branch` - 完成开发分支
- `using-git-worktrees` - Git Worktree 使用

**目录**: `superpowers/`

---

### wefidevkits

`wefidevkits` 是面向 Claude Code 的 workflow-first 技能套件，也保留了面向其他宿主的生成能力。它吸收了 `superpowers` 的流程路由与启动嵌入思路，以及 `gstack` 风格的模板源与构建输出。

**核心定位**:
- 用 intake skill 把会话导向标准开发流程，而不是直接进入零散实现
- 通过 Claude Code hooks 把流程约束嵌入到 `SessionStart`、`Stop`、`PreToolUse`
- 提供 git 提交控制与每日问题记录，支持持续优化

**当前技能**:
- `wefi-intake` - 会话入口与流程分诊
- `wefi-scope` - 明确范围、约束与目标
- `wefi-sequence` - 产出可执行步骤与顺序
- `wefi-execute` - 按计划推进实现
- `wefi-review-loop` - 评审与迭代闭环
- `wefi-root-trace` - 面向根因的系统化排障
- `wefi-commit-gate` - Git 提交前检查与策略约束
- `wefi-exit-check` - 完成前验证与收尾

**流程形态**:
```text
wefi-intake -> wefi-scope -> wefi-sequence -> wefi-execute | wefi-review-loop -> wefi-commit-gate -> wefi-exit-check
```

调试问题会优先进入 `wefi-root-trace`，再回到 `wefi-exit-check` 做最终验证。

**Claude Code 集成能力**:
- `SessionStart`: 自动注入 `wefi-intake`，让会话从流程入口开始
- `Stop`: 对未经验证的完成声明做软提醒，并记录当天显式提及的问题
- `PreToolUse`: 针对 `git commit` 执行提交策略控制

**Git 提交控制模式**:
- `confirm-each`: 每次 `git commit` 前都要求先获得用户确认
- `skill-governed`: 不做硬阻断，但要求流程经过 `wefi-commit-gate`
- `auto`: 允许自动提交

**每日学习记录**:
- 默认只记录用户显式提及的问题或需要关注的事项
- 输出到项目内 `.claude/wefidevkits/daily/`
- 生成 `YYYY-MM-DD.jsonl` 与 `YYYY-MM-DD.md`

**目录**: `wefidevkits/`

---

### 遗留系统考古 (Legacy System Archaeology)

系统化地挖掘和整理遗留系统的隐性知识，转化为可传承的文档资产。

**适用场景**:
- 接手需要维护的遗留系统
- 系统重构前的知识沉淀
- 系统交接的文档准备
- 理解未知系统的内部机制

**核心功能**:
- 五维考古方法论 (业务/技术/接口/UI/运维)
- 标准化的文档模板
- 进度跟踪检查清单

**目录**: `legacy-system-archaeology/`

---

### Impeccable (Frontend Design)

专业的前端设计技能，提供卓越的 UI/UX 设计指导。

**技能**: `teach-impeccable`

**适用场景**:
- UI/UX 设计
- 交互设计评审
- 前端设计规范制定

**来源**: [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

**目录**: `impeccable/`

---

### Frontend Design

创建高质量前端界面的专业技能。

**适用场景**:
- 组件设计
- 页面布局
- 交互实现

**目录**: `frontend-design/`

---

### MCP Builder

构建高质量的 MCP (Model Context Protocol) 服务器。

**适用场景**:
- 创建 MCP 服务器
- 集成外部服务
- 扩展 Claude 能力

**来源**: [anthropics/skills](https://github.com/anthropics/skills)

**目录**: `mcp-builder/`

---

### Documentation Writer

高质量软件文档编写专家。

**适用场景**:
- API 文档
- 用户指南
- 技术规范

**目录**: `documentation-writer/`

---

### 流程图生成器 (Flowchart Generator)

快速生成各种类型的流程图和架构图。

**适用场景**:
- 技术文档编写
- 系统架构设计
- 业务流程可视化

**目录**: `flowchart-generator/`

---

### 文档转 Markdown (doc2md)

将各类文档转换为 Markdown 格式，保留原文结构，图片通过视觉模型理解后转为文字描述，并自动校验信息完整性。

**支持格式**:
- PDF、DOCX、XLSX、PPTX、TXT

**核心功能**:
- 零外部依赖，完全基于 Claude Code 原生能力
- 两阶段分离处理（文本提取 + 图片处理）
- 系统界面截图深度分析
- 自动校验信息完整性
- 本地模型支持（无速率限制，更快速度）

**适用场景**:
- 转换技术文档
- 处理操作手册
- 提取系统规范文档
- 分析系统界面截图

**使用方式**:
```bash
# 使用在线模型（默认）
/doc2md <文件路径> [--output <输出路径>]

# 使用本地模型（推荐，无速率限制）
/doc2md <文件路径> [--output <输出路径>] --local-model <API地址> <模型名>

# 示例：使用本地 LM Studio
/doc2md document.pdf --local-model http://10.65.169.240:1234/v1 qwen/qwen3.5-9b
```

**默认本地配置**:
- 工具：LM Studio
- 地址：`http://10.65.169.240:1234/v1`
- 模型：`qwen/qwen3.5-9b`

**目录**: `doc2md/`

## 安装指南

### 安装 Superpowers

```bash
npx skills add https://github.com/obra/superpowers
```

### 安装 wefidevkits

如果只需要全局技能：

```bash
cd wefidevkits
npm run build
npm run install:claude:user
```

如果要安装到某个 Claude Code 项目，并启用 hook：

```bash
cd wefidevkits
npm run build
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project
```

可在安装时选择 git 提交策略：

```bash
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode confirm-each
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode skill-governed
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project --git-commit-mode auto
```

后续也可以单独切换模式：

```bash
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode confirm-each
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode skill-governed
node scripts/set-commit-mode.mjs --project-dir /path/to/your/project --mode auto
```

### 安装 Impeccable

```bash
npx skills add https://github.com/pbakaus/impeccable --skill teach-impeccable
```

### 安装 MCP Builder

```bash
npx skills add https://github.com/anthropics/skills --skill mcp-builder
```

### 安装 Documentation Writer

```bash
npx skills add https://github.com/anthropics/skills --skill documentation-writer
```

### 安装 doc2md

```bash
npx skills add https://github.com/wg-guarantee/AI-workflow-skills --skill doc2md
```

## wefidevkits 仓库结构

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

## 推荐工作流

```text
规划阶段 -> brainstorming / wefi-scope / wefi-sequence
设计阶段 -> teach-impeccable / frontend-design
开发阶段 -> test-driven-development / wefi-execute
调试阶段 -> systematic-debugging / wefi-root-trace
文档阶段 -> documentation-writer / doc2md
验证阶段 -> verification-before-completion / wefi-exit-check
提交阶段 -> wefi-commit-gate
```

## 技能组合示例

### 系统考古 + 文档处理

```text
/doc2md system_manual.pdf --output ./docs
/legacy-system-archaeology
```

### workflow-first 开发

```text
会话开始 -> wefi-intake
明确范围 -> wefi-scope
拆分步骤 -> wefi-sequence
执行实现 -> wefi-execute
验证收尾 -> wefi-exit-check
```

### 设计 + 文档

```text
/frontend-design
/documentation-writer
```

*最后更新: 2026-03-27*
