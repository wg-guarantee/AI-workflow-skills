# AI Workflow Skills

Claude Code 技能集合，用于增强 AI 辅助开发工作流。

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
- ⚡ **本地模型支持**（无速率限制，更快速度）

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

---

## 安装指南

### 安装 Superpowers (全流程覆盖)

```bash
npx skills add https://github.com/obra/superpowers
```

### 安装 Impeccable (UI/UX 设计)

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

### 安装 doc2md (文档转 Markdown)

```bash
npx skills add https://github.com/wg-guarantee/AI-workflow-skills --skill doc2md
```

---

## 推荐工作流

```
规划阶段 → brainstorming
设计阶段 → teach-impeccable / frontend-design
开发阶段 → test-driven-development
调试阶段 → systematic-debugging
文档阶段 → documentation-writer / doc2md
验证阶段 → verification-before-completion
```

---

## 技能组合示例

### 系统考古 + 文档处理

```
# 获取遗留系统的操作手册 PDF
/doc2md system_manual.pdf --output ./docs

# 使用考古技能分析系统
/legacy-system-archaeology

# 结合两者生成完整的系统文档
```

### 设计 + 文档

```
# 使用前端设计技能创建界面
/frontend-design

# 使用文档技能生成设计文档
/documentation-writer
```

*最后更新: 2026-03-20*
