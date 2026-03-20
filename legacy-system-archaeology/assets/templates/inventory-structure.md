# Inventory 目录结构模板

这是遗留系统知识考古的标准化输出目录结构。

## 目录结构

```
inventory/
├── business/                    # 业务维度文档
│   ├── business-flow-analysis.md    # 业务流程总览
│   ├── roles.md                     # 角色权限清单
│   ├── workflows.md                 # 详细业务流程
│   ├── status-machines.md           # 状态机定义
│   └── user-manuals/                # 用户操作手册
│       ├── manual-role-a.md
│       └── manual-role-b.md
│
├── code/                        # 技术维度文档
│   ├── backend.md                   # 后端代码清单
│   ├── frontend.md                  # 前端代码清单
│   └── architecture-diagrams/       # 架构图
│       ├── system-architecture.png
│       └── deployment-architecture.png
│
├── database/                    # 数据库文档
│   ├── entities.md                  # 实体类清单
│   ├── enums.md                     # 枚举定义
│   ├── schema.sql                   # 建表脚本
│   └── relationships/               # 关系图
│       └── er-diagram.png
│
├── api/                         # 接口文档
│   ├── endpoints.md                 # API端点清单
│   ├── error-codes.md               # 错误码定义
│   └── validation-rules.md          # 验证规则
│
├── ui/                          # UI文档
│   ├── pages.md                     # 页面清单
│   ├── components.md                # 组件清单
│   ├── ui-spec.md                   # UI规范
│   └── screenshots/                 # 界面截图
│       ├── common/
│       ├── role-a/
│       └── role-b/
│
├── ops/                         # 运维文档
│   ├── deployment.md                # 部署文档
│   ├── environment.md               # 环境配置
│   ├── monitoring.md                # 监控文档
│   └── test-reports/                # 测试报告
│       ├── test-report-xxx.md
│       └── test-accounts.md
│
├── glossary.md                  # 术语表
├── faq.md                       # 常见问题
└── README.md                    # 目录说明
```

## 文档命名规范

| 文档类型 | 命名格式 | 示例 |
|----------|----------|------|
| 业务流程 | {domain}-flow-analysis.md | customer-flow-analysis.md |
| 角色文档 | roles.md | roles.md |
| 代码清单 | {tech}-stack.md | backend.md, frontend.md |
| API文档 | {api-type}.md | endpoints.md, error-codes.md |
| 操作手册 | manual-{role}.md | manual-admin.md |
| 测试报告 | test-report-{date}.md | test-report-2026-03-19.md |

## 文档编写建议

1. **使用Markdown格式** - 便于版本控制和在线阅读
2. **包含目录** - 使用 `[TOC]` 或手动生成目录
3. **添加时间戳** - 在文档底部标注创建/更新时间
4. **使用表格** - 结构化数据优先使用表格
5. **添加图表** - 使用ASCII艺术或嵌入图片
6. **代码示例** - 使用代码块展示示例
