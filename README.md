# AI Workflow Skills

Claude Code 技能集合仓库。

这个仓库现在分成两层：

- 仓库根目录：保留现有技能集合与总览说明
- `wefidevkits/`：新增的 workflow-first 技能系统、生成器、schema、Claude hooks 模板

## 主要目录

- `superpowers/`：通用开发流程技能集合
- `legacy-system-archaeology/`：遗留系统考古
- `doc2md/`：文档转 Markdown
- `documentation-writer/`：文档编写
- `flowchart-generator/`：流程图生成
- `wefidevkits/`：workflow-first 技能套件

## wefidevkits

`wefidevkits` 面向 Claude Code，重点是把流程控制嵌入到实际会话和 hook 里，而不是只提供静态技能说明。

它当前包含：

- workflow 路由技能链：`wefi-intake`、`wefi-scope`、`wefi-sequence`、`wefi-execute`
- 质量与验证技能：`wefi-review-loop`、`wefi-exit-check`
- 调试技能：`wefi-root-trace`
- Git 提交控制技能：`wefi-commit-gate`
- Claude Code hook 模板：`SessionStart`、`Stop`、`PreToolUse`
- 每日 learning 记录能力：默认只记录用户显式提及的问题

项目说明见 [wefidevkits/README.md](wefidevkits/README.md)。

## 使用 wefidevkits

进入子目录后执行：

```bash
cd wefidevkits
npm run build
```

如果要安装到 Claude Code 项目：

```bash
cd wefidevkits
node scripts/install-claude.mjs --target project --project-dir /path/to/your/project
```

## 现有技能集合

### Superpowers

典型技能包括：

- `brainstorming`
- `systematic-debugging`
- `test-driven-development`
- `writing-plans`
- `verification-before-completion`
- `executing-plans`

### 其他

- `legacy-system-archaeology`
- `frontend-design`
- `impeccable`
- `mcp-builder`
- `doc2md`

*最后更新: 2026-03-27*
