# 技术维度考古

## 概述

技术维度考古专注于从技术实现角度理解遗留系统，包括代码结构、数据库设计、技术栈等。

## 1. 后端代码分析 (backend.md)

### 分析目标
- 理解后端代码的组织结构
- 识别代码分层和模块划分
- 梳理API端点和业务逻辑

### 输出模板

```markdown
# 后端代码清单

## 项目信息

- **项目名**: xxx
- **路径**: ./xxx
- **构建工具**: Maven/Gradle/npm
- **语言版本**: xxx
- **框架版本**: xxx

## 目录结构

```
project/
├── src/main/java/com/company/
│   ├── common/          # 公共模块
│   │   ├── constants/   # 常量定义
│   │   ├── exception/   # 异常处理
│   │   └── utils/       # 工具类
│   ├── core/            # 核心模块
│   │   ├── config/      # 配置类
│   │   ├── entity/      # 实体类
│   │   ├── mapper/      # 数据访问
│   │   └── security/    # 安全配置
│   └── modules/         # 业务模块
│       ├── module1/     # 业务模块1
│       └── module2/     # 业务模块2
```

## Controller 层

### 模块名 (XxxController)
| 文件路径 | API前缀 |
|----------|---------|
| `modules/xxx/controller/XxxController.java` | `/api/v1/xxx` |

**API端点:**
| 方法 | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | /xxx/list | 列表查询 | ROLE_X |
| POST | /xxx/create | 创建 | ROLE_Y |

## Service 层

| 模块 | 接口 | 实现类 |
|------|------|--------|
| 模块名 | XxxService | XxxServiceImpl |

## DTO 层

| DTO类 | 用途 |
|-------|------|
| XxxRequest | 请求DTO |
| XxxResponse | 响应DTO |
```

### 关键问题
- 代码如何分层？（Controller/Service/Mapper等）
- 有哪些业务模块？每个模块负责什么？
- API端点如何组织？
- 异常如何处理？
- 如何实现权限控制？

---

## 2. 前端代码分析 (frontend.md)

### 分析目标
- 理解前端代码的组织结构
- 识别组件和页面
- 梳理路由和状态管理

### 输出模板

```markdown
# 前端代码清单

## 项目信息

- **项目名**: xxx
- **路径**: ./xxx
- **构建工具**: Vite/Webpack
- **框架版本**: xxx

## 目录结构

```
src/
├── api/             # API客户端
├── components/      # 公共组件
├── composables/     # 组合函数
├── constants/       # 常量定义
├── router/          # 路由配置
├── stores/          # 状态管理
├── types/           # 类型定义
├── utils/           # 工具函数
└── views/           # 页面组件
```

## 页面组件 (Views)

### 模块页面 (`views/xxx/`)
| 文件 | 路由 | 功能 |
|------|------|------|
| Xxx.vue | /xxx | 功能描述 |

## API 客户端 (`api/`)

| 文件 | 功能 | 主要方法 |
|------|------|----------|
| xxx.ts | 功能描述 | method1, method2 |

## 路由配置

| 路由 | 组件 | 权限 |
|------|------|------|
| /path | Component | ROLE |

## 状态管理 (Stores)

| Store | 功能 | 主要State |
|-------|------|-----------|
| xxx.ts | 功能描述 | state1, state2 |
```

### 关键问题
- 前端框架是什么？版本多少？
- 页面如何组织？按角色还是按功能？
- API调用如何管理？
- 状态如何管理？
- 如何处理路由权限？

---

## 3. 数据库分析 (entities.md, schema.sql, enums.md)

### 分析目标
- 理解数据库表结构
- 识别实体关系
- 梳理枚举值定义

### 输出模板

```markdown
# 实体类清单

## 实体类概览

| 实体类 | 表名 | 主要用途 |
|--------|------|----------|
| EntityName | TM_TABLE_NAME | 用途说明 |

## 1. EntityName (实体说明)

**文件路径**: `core/entity/EntityName.java`

**表名**: `TM_TABLE_NAME`

### 字段清单

| 字段名 | Java类型 | 数据库类型 | 说明 |
|--------|----------|------------|------|
| id | Long | BIGINT | 主键ID |
| name | String | VARCHAR(100) | 名称 |

### 关联关系
- 多对一关联 EntityA
- 一对多关联 EntityB
```

```markdown
-- 数据库建表脚本
-- 文件: schema.sql

CREATE TABLE `TM_TABLE_NAME` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `field_name` VARCHAR(100) COMMENT '字段说明',
    PRIMARY KEY (`id`),
    INDEX `idx_field` (`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='表说明';
```

```markdown
# 枚举定义清单

## 枚举概览

| 枚举名 | 说明 | 值数量 |
|--------|------|--------|
| EnumName | 说明 | N |

## EnumName

| 值 | 代码 | 说明 |
|------|------|------|
| 值名 | VALUE_CODE | 值说明 |
```

### 关键问题
- 有哪些核心表？每个表存储什么？
- 表之间如何关联？一对多？多对多？
- 哪些字段是状态字段？
- 有哪些枚举类型？
- 索引如何设计？
- 是否有外键约束？

---

## 考古方法

### 信息来源
- 代码目录结构
- 配置文件（pom.xml, package.json, application.yml等）
- 数据库DDL脚本
- API文档（Swagger/OpenAPI）
- 代码注释
- Git提交历史

### 分析技巧
1. **从目录结构推断架构**: 分层、模块化、微服务
2. **从依赖推断技术栈**: pom.xml, package.json, requirements.txt
3. **从配置推断环境**: application.yml, .env, config files
4. **从注释推断业务逻辑**: 关键业务逻辑的注释说明

### 工具辅助
- **代码搜索**: grep/ripgrep 搜索关键词
- **依赖分析**: mvn dependency:tree, npm ls
- **数据库工具**: 导出表结构、ER图生成
- **API工具**: Swagger UI, Postman collection

### 常见陷阱
- 只看代码不看配置（配置往往包含重要信息）
- 忽略数据库约束和触发器
- 混淆开发环境和生产环境配置
- 忽略版本兼容性问题
