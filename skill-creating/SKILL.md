---
name: skill-creating
description: >
  Use when someone wants to learn what Claude Code skills are, create new skills, modify/improve existing skills, measure skill performance, or work with AI effectively through skills. Triggers on "不知道 skill 是什么", "学习 skill", "learn skills", "get started with skills", "teach me skills", "create a skill", "make a skill", "improve skill", "optimize skill", "skill evals", "skill benchmark", "skill description optimization", or when user expresses confusion about skills vs prompts vs MCP. Also use when users want to create a skill from scratch, edit or optimize an existing skill, run evals to test a skill, benchmark skill performance, or optimize a skill's description for better triggering accuracy.
---

# Skill Onboarding & Creator -- 从零到 Skill Builder，再到工程化迭代

## Overview

这不是一堂课，是一次体验。用户做完后会拥有 3 个 working skills，理解 skill 跟提示词/MCP 的区别，并知道如何独立创建新的 skill。

进阶可选：帮用户从 skills.sh 社区市场筛选最匹配的 skill（Stage 5），建立"素材箱"机制让 AI 持续帮用户把好内容转化成 skill（Stage 6），或使用工程化测试/评估/基准工具系统性迭代 skill（Stage 7）。

**核心洞察**：Skill 开发正从「艺术品」转向「工程产品」——不是写完就扔，而是持续测试、迭代、验证的活资产。

## Core Principles

- **Show > Tell > Explain** — 先看结果，再讲原理
- **每个用户反应都是测试用例** — 困惑、质疑、推回，都要正面回应
- **This skill practices what it preaches** — 自带 scripts/ 和 assets/ 作为演示素材
- **测试即基础设施** — 好的 skill 必须有验证机制，不是凭感觉迭代

启动时先运行：`bash scripts/ensure-deps.sh`

**版本：v4.0** (2026-03-11)

## Stage 0: 先看一眼（新增）

在说任何话之前，先打开可视化说明页，让用户有个直观印象：

```bash
open assets/skill-explainer.html
```

然后说："**先花 30 秒看一下这个页面，看完咱们直接动手写一个。**"

等用户确认看过（或说"看了""好了"）再进入 Stage 1。如果用户说"不用看了/直接开始"，跳过进入 Stage 1。

## The Journey

```
Stage 0: 先看一眼 → 打开可视化说明页，30秒建立直观认知
Stage 1: 认识 + 动手 → "原来 skill 就是这个，我也能写"
Stage 2: 体验差异 → "确实不只是提示词"
Stage 3: 去市场找 → "我找到一个别人做的，改成了我的"
Stage 4: 独立 → "我知道以后怎么继续了"
Stage 5: [可选] Skill 扫描与筛选 → "帮我看看哪些值得装"
Stage 6: [可选] 授权 AI 制作 Skill → "我把好东西丢给你，你帮我做成 skill"
Stage 7: [可选] 工程化迭代 → "用测试/评估/基准系统性提升 skill 质量"
```

Stage 1-4 是必经之路。Stage 5-7 是进阶可选项——在 Stage 4 结束时主动询问用户是否感兴趣。

每个 Stage 有明确的 EXIT CONDITION——用户没达到就不往下走。

---

## Stage 1: 认识 + 动手 — 30 秒介绍，然后马上写一个

**Goal:** 用最短的介绍让用户知道 skill 是什么，然后立刻动手写一个。用户通过"做"来理解，而不是通过"听"。

**EXIT CONDITION:** 用户有一个 working SKILL.md，看到了它的实际效果，并且理解了每一行。

### Step 1: 30 秒介绍（不超过 5 句话）

> "Skill 就是一个 markdown 文件，放在固定目录下，AI 会自动读取并按里面的指令工作。你可以把它理解为「教 AI 一个新技能」。
> 
> 它跟直接在对话里写提示词的区别：skill 是持久的（不用每次粘贴）、可以自动触发（AI 自己判断什么时候用）、还能带脚本和参考文件。
> 
> 废话不多说，我们直接写一个。"

### Step 2: 问需求，马上写

1. 问 ONE question: **"你最想让 AI 帮你自动做什么事？"**
   - 给例子帮用户想：总结文章、翻译、写邮件、整理笔记、代码审查……
   - 选一个最容易出效果的

2. **快速创建** — 使用官方脚手架工具初始化（推荐），或 AI 手写：

   **方式 A：脚手架初始化（推荐）**
   ```bash
   # Claude Code 用户（推荐）：
   python3 scripts/init_skill.py <skill-name> --path ~/.claude/skills
   # 或 Codebuddy 用户：
   python3 scripts/init_skill.py <skill-name> --path ~/.codebuddy/skills
   ```
   脚本会自动创建目录结构 + 模板 SKILL.md + 示例 scripts/references/assets/。
   然后**一起编辑 SKILL.md**：删掉 TODO 占位符，填入用户需求。

   **方式 B：AI 手写最小版本**（不超过 20 行）
   - **确认 skill 目录**：先问用户用的是什么工具（Claude Code / Codebuddy / Cursor），然后创建到对应目录：
     - Claude Code（推荐）: `~/.claude/skills/<name>/SKILL.md`
     - Codebuddy: `~/.codebuddy/skills/<name>/SKILL.md`
     - 或项目级：`.claude/skills/<name>/SKILL.md` / `.codebuddy/skills/<name>/SKILL.md`
   - 直接展示写好的文件内容给用户看
   - **逐行解释每一行的作用**，特别是：
     - frontmatter 的 `name` 和 `description`："description 是触发器，写什么时候用，不写怎么工作"
     - body 的指令部分："Claude 本身很聪明，只写它不知道的规则"

3. **马上用真实例子测试**
   - 问用户有没有现成内容可以试，没有就 AI 提供一个逼真的样本
   - 运行 skill，展示完整输出
   - **问用户："想改什么？"**

### Step 3: 展示修改过程（核心体验）

这一步是让用户理解 skill 迭代的关键——**不是默默改好，而是展示"我改了哪里、为什么改"**。

当用户提出修改要求后：

1. **先复述** 用户的要求（一句话）
2. **展示 diff** — 用清晰的对比格式展示修改：
   ```
   📝 根据你的要求，我改了这些地方：
   
   ① description 触发词补充了 "XXX"
      旧：Use when ...
      新：Use when ... or when user says "XXX"
   
   ② 输出格式从纯文本改成了结构化 markdown
      新增了3条输出规则：[具体列出]
   
   ③ 加了一条禁止规则
      新增：NEVER do XXX
   ```
3. **重新运行** 同一个例子，让用户看到改动后的效果差异
4. 如果还要改 → 重复这个过程

### Step 4: 沉淀确认

用户满意后，问：**"要不要把刚才的改动更新到你的 skill 文件里？"**

- 用户说"要" → 把最新版本写入 SKILL.md，告诉用户文件已更新
- 用户说"不要" / "先不" → 跳过，进入 Stage 2
- **这一步的意义**：让用户建立"调试 → 满意 → 沉淀"的习惯，理解 skill 是可以不断迭代更新的

满意且沉淀完成后 → 进入 Stage 2

**关键：用户通过看到"改了什么 → 效果怎么变 → 沉淀到文件"这个完整循环，自然学会了 skill 的迭代方式。这比任何讲解都有效。**

---

## Stage 2: 体验差异 — 让用户亲手感受 Skill 的三个独特能力

**Goal:** 用户不只是听说 skill 跟提示词不一样，而是**亲手体验**到区别。

**EXIT CONDITION:** 用户完成了至少 2 个体验，能说出 skill 跟提示词的核心区别。

### 体验 1: 自动触发 — "什么都不说，AI 自己知道"

**做法（不是说法）：**

1. 告诉用户："现在你开一个新对话（或者就在这里），直接贴一段内容进来，什么指令都不给，看看 AI 会不会自动用你刚才创建的 skill。"
2. 如果用户刚做的 skill 是翻译类 → 让他贴一段英文
3. 如果是总结类 → 让他贴一篇长文
4. 等 AI 自动触发后，指出：**"看到了吗？你什么都没说，AI 看到内容自动就按你的 skill 处理了。提示词做不到这个——你得每次记得粘贴提示词。"**

如果当前对话中已经加载了 onboarding skill 导致自动触发不好演示，就用话术引导："等你下次开一个新对话试试，直接贴内容，不说任何指令。"

### 体验 2: 带脚本的 Skill — "skill 不只是文字，还能带可执行代码"

**做法（不是说法）：**

1. **先展示一个带脚本的 skill 的目录结构**——用 onboarding 自身：
   ```bash
   ls -la ~/.claude/skills/skill-creating/
   ls -la ~/.claude/skills/skill-creating/scripts/
   cat ~/.claude/skills/skill-creating/scripts/show-skills.sh
   ```
   指出："看，这个正在教你的 skill 本身就带了脚本。"

2. **当场运行脚本让用户看到效果**：
   ```bash
   bash ~/.claude/skills/skill-creating/scripts/show-skills.sh
   ```
   "这个脚本列出了你所有已安装的 skill（跨所有目录自动扫描），还标注了哪些带脚本、哪些带参考文档。"

3. **再展示一个更复杂的例子**——找一个已安装的、带 scripts/ 的 skill（如 pdf、pptx、data-analysis 等），展示它的脚本做了什么：
   - 读出脚本的前几行注释，说明功能
   - 如果条件允许，**当场运行**一个小功能让用户看到
   - "提示词就是一段文字。Skill 可以带完整的 Python 脚本、Shell 工具、参考文档。这是本质区别。"

4. **可选：展示 assets/**——打开 `assets/skill-explainer.html`
   ```bash
   open ~/.claude/skills/skill-creating/assets/skill-explainer.html
   ```
   "这是 skill 自带的交互式说明页面。提示词做不到带 HTML 文件。"

### 体验 3: 渐进加载 — "装 100 个不会变慢"

**做法（不是说法）：**

1. 运行 show-skills.sh，数一下总数
2. 解释："你看到了 N 个 skill。但平时 AI 只读每个 skill 的 description（几十个字）。整个 body 只有触发时才加载。这意味着你装 100 个 skill，跟装 1 个占用的上下文差不多。"
3. 对比："如果你用提示词实现同样的功能，你得把所有提示词全贴进对话。10 个提示词可能就占满上下文了。"

### 补充：Skill vs MCP（仅在用户知道 MCP 时才讲）

如果用户不知道 MCP → 一句话带过："以后你会听到 MCP——那是给 AI 加工具的（比如读写文件、调 API），跟 skill 不同层，用到再了解。"

如果知道 MCP：
- Skill = 教 AI 方法（一本菜谱）
- MCP = 给 AI 工具（一把刀）
- System Prompt = 定义 AI 身份（厨房规矩）
- Skill 里可以调用 MCP 工具，MCP 不知道 Skill 的存在

---

## Stage 3: 去市场找 — 探索 Skill 生态 + 质量评估

**Goal:** 用户发现外面有大量现成的 skill，学会**评估质量**、找到并改造成自己的。

**EXIT CONDITION:** 用户 fork 并定制了一个外部 skill，并且能说出判断 skill 质量好坏的标准。

### How to Execute

1. 问："你还想让 AI 学会什么能力？"

2. **直接去外部市场搜索**（不在本地找）：
   - **Anthropic 官方仓库**：`https://github.com/anthropics/skills` — 搜索并浏览
   - **skills.pub**：`https://skills.pub` — 社区第三方市场，400+ skill
   - 如果上面没找到 → `web_search` 搜 GitHub
   - 展示找到的匹配结果（名称 + 简介 + 链接）

3. **质量评估**（核心——教用户判断好坏）：

   找到候选 skill 后，**先评估再安装**：

   ```bash
   # 自动评估（如果已下载到本地）
   bash scripts/evaluate-skill.sh <skill-directory>
   ```

   脚本会自动检查结构、内容质量、资源完整性，输出评分和建议。

   **教用户人工快速判断的 5 条标准**：

   > "网上 skill 良莠不齐，看这 5 点就能快速判断质量："
   >
   > **① description 写的是'什么时候用'还是'怎么工作'？**
   > - ✅ 好："Use when summarizing long documents or meeting notes"
   > - ❌ 差："Creates summary by extracting key points and formatting"
   > - 原因：description 是触发器，写错了 AI 根本不知道什么时候该用
   >
   > **② 有没有 TODO 占位符？**
   > - 搜 "TODO" ——有就是半成品，作者没写完就发了
   >
   > **③ SKILL.md 是不是过长（>5000字）？**
   > - 过长说明作者什么都往里塞，该放 references/ 的没分离
   > - 每次触发都加载这么多到上下文，浪费 token
   >
   > **④ 有没有具体的行为约束？**
   > - 好的 skill 会写 MUST / NEVER / DO NOT 等明确规则
   > - 只有"概述"没有"规则"的 skill，AI 会自由发挥，结果不可控
   >
   > **⑤ 带不带脚本（scripts/）？**
   > - 带脚本的 skill 更强——有确定性的自动化能力
   > - 纯文字 skill 也可以，但上限低

4. **进阶：Skill 的"工程成熟度"评估**

   参考 Anthropic skill-creator 的最佳实践，高质量 skill 还应具备：

   > **A. 可测试性**
   > - 有没有提供测试用例或示例输入？
   > - 用户能否快速验证 skill 是否按预期工作？
   
   > **B. 版本兼容性意识**
   > - 是否注明了适用的模型版本？
   > - 有没有应对模型能力进化的策略（当模型原生能力追上 skill 时，skill 应该"退休"）
   
   > **C. 防御性设计**
   > - 是否有防止误用的安全检查？
   > - 高风险操作是否有显式确认机制？

5. 找到质量合格的 skill 后，**Fork + 定制**：
   - 复制到用户的 skill 目录（Stage 1 确认过的路径）：`~/.claude/skills/<新名字>/`（或 `~/.codebuddy/skills/`）
   - 修改 description 和 body——同样**展示 diff**（跟 Stage 1 一样的修改展示方式）
   - Fork 清理检查：
     - [ ] 参考文件还适用吗？
     - [ ] 相对路径引用能解析吗？
     - [ ] 删除原作者的 LICENSE.txt
     - [ ] 删除跟新版本重复的内容
   - **测试**定制后的版本

---

## Stage 4: 独立 — Graduation

**Goal:** 用户知道怎么继续，并把真实反馈发送给作者。

**EXIT CONDITION:** 用户发送了反馈邮件（或明确跳过）。

### 成果回顾

列出本次创建的所有 skill（路径 + 功能）。

### Cheat Sheet

```
# Claude Code 用户（推荐）：
~/.claude/skills/skill-name/
# Codebuddy 用户：
~/.codebuddy/skills/skill-name/

  SKILL.md              # 必须。skill 本体。
  scripts/              # 可选。可执行脚本。
  references/           # 可选。参考文档。
  assets/               # 可选。资源文件。
```

**Frontmatter 规则：**
- `name`: 只能用字母、数字、连字符
- `description`: 写"什么时候用"，不写"怎么工作"

```yaml
# ❌ 错误：描述工作流程
description: Creates summary by extracting key points and formatting them

# ✅ 正确：描述触发条件
description: Use when summarizing long documents, articles, or meeting notes
```

### 日常操作

- **看你的 skills**：`bash ~/.claude/skills/skill-creating/scripts/show-skills.sh` 或 `ls ~/.claude/skills/`
- **删除**：`rm -rf ~/.claude/skills/skill-name/`（或对应的 .codebuddy 路径）
- **编辑**：markdown 文件，任何编辑器都能改
- **分享**：复制文件夹给别人

### 持续提升

1. **用例先行** — 收集真实使用场景再写
2. **最小化** — Claude 很聪明，只写它不知道的
3. **真实测试** — 用真实任务测，不用假设场景
4. **迭代** — 用 → 发现问题 → 改 → 再用

### SKILL.md 四种结构模式（按需选）

| 模式 | 适用场景 | 结构 |
|------|---------|------|
| **工作流型** | 有明确步骤的流程 | Overview → Step 1 → Step 2 → ... |
| **任务型** | 多种独立操作 | Overview → Task A → Task B → ... |
| **参考型** | 标准/规范 | Overview → Guidelines → Specs → Usage |
| **能力型** | 集成系统 | Overview → Capability 1 → Capability 2 → ... |

可混合使用。大多数好的 skill 会组合多种模式。

### 打包分享

做好的 skill 可以打包分享给别人：

```bash
# 打包成 zip（自动验证格式）
python3 scripts/package_skill.py ~/.claude/skills/<skill-name>/
```

zip 文件可以直接发给别人，解压到对应 skills/ 目录即可使用。

### Skill 复利

每个 skill 是你工作方式的一个切面。装得越多，AI 越理解你的偏好。不需要每次重复解释。

### Skill 的"CI/CD"思维

从 Claude skill-creator 的工程实践中学到的核心方法论：

**1. 测试-基准-迭代闭环**
```
写 Skill → 用真实案例测试 → 记录效果 → 发现偏差 → 修改 → 再测试
```
- 不要"写完就扔"
- 保留测试用例，方便下次迭代时快速验证

**2. 量化验证替代凭感觉**
- 记录：触发成功率、输出质量评分、耗时
- 对比：修改前后的差异（A/B 测试思维）
- 决策：基于数据决定 skill 是否需要更新或"退休"

**3. Skill 的两种类型**

| 类型 | 定义 | 测试重点 | 何时退休 |
|------|------|---------|---------|
| **能力提升型** | 教 AI 原本做不到/做不稳的事 | 监控模型通用能力是否已追上 | 基线模型无需 skill 即可通过测试 |
| **偏好编码型** | 按团队流程严格排序 | 验证是否忠实还原真实工作流 | 流程变更时更新 |

### Step 最后: 收集反馈 + 自动发送邮件

**这一步必须执行，不能跳过。**

1. **问用户反馈**：
   > "最后一个问题——你对今天这个 skill 入门体验有什么反馈？觉得哪里好、哪里不好、有什么建议，随便说。"

2. **用户发送反馈后，立即自动打开邮件**——用 `open` 命令调起系统默认邮件客户端，预填收件人、主题和正文：

   ```bash
   # 构建 mailto URL（对反馈内容做 URL 编码）
   FEEDBACK="<用户的反馈原文>"
   SUBJECT="Skill Onboarding 体验反馈"
   BODY="来自一位新用户的 Skill Onboarding 体验反馈：

${FEEDBACK}

---
发送时间：$(date '+%Y-%m-%d %H:%M')
环境：$(uname -s) / $(whoami)"

   open "mailto:ameliay1y1@gmail.com?subject=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${SUBJECT}'))")&body=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''${BODY}'''))")"
   ```

3. **执行要点**：
   - 收件人固定：`ameliay1y1@gmail.com`
   - 主题固定：`Skill Onboarding 体验反馈`
   - 正文包含：用户反馈原文 + 发送时间 + 系统环境信息
   - 用 `open "mailto:..."` 调起 macOS 默认邮件客户端，用户只需点发送
   - 如果 `open mailto` 失败，fallback：把邮件内容打印出来，让用户手动发送

4. 邮件打开后，告诉用户：**"邮件已经帮你打开了，内容也填好了，你检查一下点发送就行。感谢你的反馈！"**

5. **询问进阶兴趣**（Stage 4 的最后一步）：
   > "到这里你已经具备了独立创建和使用 skill 的能力。接下来有三个可选项，看你感不感兴趣：
   >
   > **A. Skill 扫描与筛选** — 我可以根据你的工作内容，帮你从 skills.sh 上几百个社区 skill 里筛选出最适合你的，做一份个性化推荐清单。
   >
   > **B. 授权 AI 制作 Skill** — 你平时看到好的文章、方法论、工作流，丢到一个文件夹里，授权给我，我帮你把它们做成 skill。
   >
   > **C. 工程化迭代** — 用测试用例、基准对比、description 优化等工程方法系统性提升 skill 质量。适合想把 skill 做得更精的用户。
   >
   > 要试试哪个？还是都来？"

   - 用户选 A → 进入 Stage 5
   - 用户选 B → 进入 Stage 6
   - 用户选 C → 进入 Stage 7
   - 用户选"都来" → 按 5 → 6 → 7 顺序
   - 用户说"不用了" → 结束，恭喜毕业

---

## Stage 5: [可选] Skill 扫描与筛选 — 帮用户找到最值得装的 Skill

**Goal:** 基于用户的实际工作内容，从 skills.sh 社区市场筛选出最匹配的 skill，输出一份个性化推荐清单。

**EXIT CONDITION:** 用户拿到一份分级推荐清单，至少安装了 1 个推荐 skill 并测试通过。

### What is skills.sh?

先用一段话介绍：

> "skills.sh（https://skills.sh/）是目前最大的 Claude Code Skill 社区市场。上面有几百个由开发者和团队贡献的 skill，覆盖开发、营销、设计、数据分析等领域。你可以把它理解为 skill 的'应用商店'——有排行榜、安装量统计、作者信息。
>
> 它跟 Anthropic 官方的 skills 仓库（github.com/anthropics/skills）不同：官方仓库是 Anthropic 团队维护的精选集，skills.sh 是社区开放贡献的，数量更多但质量参差不齐——所以才需要筛选。"

### How to Execute

1. **了解用户工作内容**（核心 -- 必须问清楚才能精准推荐）：

   > "要帮你筛选，我得先了解你平时用 AI 做什么。简单说说：
   >
   > - 你的主要工作内容是什么？（比如写代码、做研究、写内容、做设计、数据分析……）
   > - 你最常让 AI 帮你做的 3 件事是什么？
   > - 有没有什么事你觉得 AI 应该能做但目前做得不好的？"

   根据回答，提炼出 3-5 个核心需求标签（如：代码质量、内容创作、研究分析、自动化……）

2. **扫描用户已有的 skill**（如果用户同意）：

   > "要不要我先扫描一下你已经装了哪些 skill？这样我推荐的时候可以避免重复，也能看看有什么空白可以补。"

   如果用户同意：
   ```bash
   bash scripts/show-skills.sh
   ```
   
   记录已有 skill 列表，分析覆盖领域和空白。

3. **去 skills.sh 搜索和筛选**：

   - 用 web_search 搜索 `site:skills.sh` + 用户的需求关键词
   - 或直接访问 `https://skills.sh/` 浏览排行榜
   - 按 Stage 3 教过的 5 条质量标准 + 工程成熟度标准评估每个候选
   - 考虑与用户已有 skill 的互补性和重复度

4. **输出分级推荐清单**：

   按这个格式输出（参考模板，根据实际搜索结果填写）：

   ```markdown
   ## 你的 Skill 推荐清单

   > 基于你的工作内容：[用户的核心需求总结]
   > 已有 skill 数量：N 个，覆盖领域：[列出]
   > 以下推荐避开了已有能力，聚焦补充空白。

   ### 强烈推荐（立即安装）
   1. **skill-name** — 一句话说明价值 + 为什么适合你
      - 安装量：X.XK | 作者：XXX | 质量评分：X/100
      - 安装命令：`npx skills add xxx/xxx/xxx`

   ### 推荐安装（补充能力）
   ...

   ### 可选安装（特定场景）
   ...

   ### 不推荐（与你已有能力重复）
   | Skill | 不推荐原因 |
   |-------|-----------|
   | xxx   | 与你的 xxx skill 功能重复 |
   ```

5. **协助安装和测试**：

   用户选中要装的 skill 后：
   - 帮用户安装（`npx skills add` 或手动下载 + 放到 skill 目录）
   - 用真实场景测试一下
   - 如果需要定制 → 回到 Stage 3 的 Fork + 定制流程

---

## Stage 6: [可选] 授权 AI 制作 Skill — 从素材到 Skill 的转化

**Goal:** 用户把觉得好的成果、方法论、文章、工作流丢到一个指定文件夹，授权 AI 帮他把这些素材制作成 skill。

**EXIT CONDITION:** 用户建好了素材文件夹，AI 成功从至少一份素材制作出一个 working skill。

### How to Execute

1. **介绍这个模式**：

   > "这个模式的思路很简单：你平时看到好的方法、好的工作流、好的文章，或者你自己做出了特别满意的成果——把它丢到一个专门的文件夹里，就像是给我一个'原材料箱'。
   >
   > 我会定期（或你随时叫我）去翻这个文件夹，把里面的素材提炼成 skill。你不需要自己写 SKILL.md，你只需要当策展人——觉得好就丢进来，剩下的我来。"

2. **创建素材文件夹**（询问用户）：

   > "要不要我帮你建一个文件夹？你可以把它放在任何你顺手的位置。建议的名字比如：
   >
   > - `skill-素材/` — 放在你的工作区里
   > - `skill-inbox/` — 放在桌面或常用目录
   >
   > 你想放哪里？还是你已经有个地方在收集这类东西了？"

   等用户确认位置后，创建文件夹并在里面放一个 `README.md` 说明：

   ```markdown
   # Skill 素材箱

   把你觉得好的东西丢到这里，AI 会帮你做成 skill。

   ## 什么可以放进来？

   - 你做出的满意成果（截图、文档、代码片段）
   - 别人的好文章、好方法论（链接或全文）
   - 你总结的工作流程或最佳实践
   - 你反复在对话里跟 AI 说的同一套指令（说明该做成 skill 了）
   - 任何你觉得"这个东西要是能自动化就好了"的场景描述

   ## 格式不限

   txt、md、pdf、截图、链接、语音转文字……什么都行。
   AI 会自己理解内容并提炼。

   ## 命名建议（可选）

   文件名加个前缀方便分类：
   - `方法-` — 方法论类（如：方法-费曼学习法.md）
   - `流程-` — 工作流类（如：流程-文章发布检查清单.md）
   - `成果-` — 满意成果类（如：成果-那篇写得特别好的分析报告.md）
   - `想法-` — 场景灵感类（如：想法-要是能自动整理会议纪要.md）
   ```

3. **演示一次转化过程**：

   如果用户当场能提供一个素材（哪怕是口述一个工作流），立刻演示：
   
   - 分析素材内容 → 提炼核心能力和触发场景
   - 写出 SKILL.md（用 Stage 1 教过的方法）
   - 展示 diff（"从你的素材里，我提取了这些要点，做成了这样的 skill"）
   - 测试运行
   - 用户满意 → 安装到 skill 目录

   > "看到了吧？你给我一篇文章，我还你一个 skill。以后你只管往文件夹里丢东西就行。"

4. **建立持续机制**：

   > "以后你想让我处理素材箱里的新东西时，就跟我说'看看素材箱'或'帮我做 skill'。
   > 我会翻一遍文件夹，挑出适合做成 skill 的素材，制作好了给你看效果。"

---

## Stage 7: [可选] 工程化迭代 -- 用测试/评估/基准系统性提升 Skill 质量

**Goal:** 用户学会用工程方法（测试用例、基准对比、description 优化）系统性迭代 skill，而不是凭感觉改。

**EXIT CONDITION:** 用户完成至少一轮"测试 → 评估 → 改进"闭环，理解量化迭代的价值。

### 核心循环

```
写/改 Skill → 设计测试用例 → 运行测试（with-skill vs baseline）
    → 评估结果（定性 + 定量）→ 改进 Skill → 重复
```

### Step 1: 设计测试用例

为 skill 写 2-3 个真实的测试提示词——用户实际会说的话。

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

保存到 `evals/evals.json`。先只写 prompt，assertions 稍后补充。

完整 schema 见 `references/schemas.md`。

### Step 2: 运行测试

对每个测试用例，同时启动两个子代理——一个用 skill，一个不用（baseline）。同时启动，不要先跑完一组再跑另一组。

**With-skill run：**
- 给子代理 skill 路径 + 测试 prompt + 输入文件
- 输出保存到 `<workspace>/iteration-N/eval-ID/with_skill/outputs/`

**Baseline run：**
- 新建 skill：不给 skill，保存到 `without_skill/outputs/`
- 改进 skill：用旧版 skill，保存到 `old_skill/outputs/`

每个测试用例写 `eval_metadata.json`（prompt + assertions）。

### Step 3: 等待时起草 assertions

测试跑的同时，为每个用例设计可验证的断言。好的 assertion 是客观可验证的，有描述性名称。

主观输出（写作风格、设计质量）不强制断言，靠人工评审。

更新 `eval_metadata.json` 和 `evals/evals.json`。

### Step 4: 评分 + 聚合 + 评审

测试完成后：

1. **评分**：用 grader 子代理（读 `agents/grader.md`）评估每个 assertion。`grading.json` 必须用 `text`/`passed`/`evidence` 字段。

2. **聚合基准**：
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   生成 `benchmark.json` 和 `benchmark.md`。

3. **分析**：读 `agents/analyzer.md`，找出聚合统计隐藏的模式（非区分性断言、高方差用例、时间/token 权衡）。

4. **启动评审查看器**：
   ```bash
   nohup python eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   ```
   迭代 2+ 时加 `--previous-workspace <workspace>/iteration-<N-1>`。
   无浏览器环境用 `--static <output_path>` 生成独立 HTML。

5. 告诉用户去浏览器看结果（Outputs 标签页看输出 + 留反馈，Benchmark 标签页看量化对比）。

### Step 5: 读反馈 + 改进

用户反馈保存在 `feedback.json`。空反馈 = 满意。聚焦有具体意见的用例。

**改进原则：**

1. **泛化而非过拟合** -- skill 要在万千场景下工作，不只是这几个测试用例。避免为特定用例写死规则。
2. **保持精简** -- 删掉不产生效果的指令。读 transcript，如果某段指令让模型浪费时间，去掉它。
3. **解释 why** -- 与其写 ALWAYS/NEVER 大写强制，不如解释为什么这样做重要。模型理解了原因就能举一反三。
4. **提取重复工作** -- 如果每个测试用例的子代理都独立写了类似的脚本，说明应该把它做成 `scripts/` 下的共享工具。

改进后重跑全部测试（新 `iteration-N+1/`），直到用户满意或不再有实质进步。

### Step 6: Description 优化

Skill 的 description 是触发机制的关键。写完 skill 后，优化 description 提升触发准确率。

1. **生成触发测试集**：20 条查询（10 条 should-trigger + 10 条 should-not-trigger）。查询要像真实用户会说的话（有细节、有背景），should-not-trigger 要选"差一点就该触发但不该"的近似场景。

2. **用户评审测试集**：
   ```bash
   # 用 assets/eval_review.html 模板生成评审页面
   # 替换 __EVAL_DATA_PLACEHOLDER__ 和 __SKILL_NAME_PLACEHOLDER__
   open /tmp/eval_review_<skill-name>.html
   ```

3. **运行优化循环**：
   ```bash
   python -m scripts.run_loop \
     --eval-set <trigger-eval.json> \
     --skill-path <path-to-skill> \
     --model <model-id> \
     --max-iterations 5 --verbose
   ```
   自动拆分 60/40 训练/测试集，每轮评估 3 次取可靠触发率，迭代优化。

4. **应用结果**：取 `best_description` 更新 SKILL.md frontmatter。

### 盲比较（高级，可选）

需要严格对比两个版本时，可用盲比较系统：

- 读 `agents/comparator.md` -- 不知道哪个是哪个版本，纯粹基于输出质量判断
- 读 `agents/analyzer.md` -- 分析赢家为什么赢，输家怎么改

大多数情况下人工评审循环就够用，盲比较是锦上添花。

### 打包

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

生成 `.skill` 文件供分享安装。

### Skill 写作指南（参考）

**结构：**
```
skill-name/
  SKILL.md (必须)
    YAML frontmatter (name, description 必填)
    Markdown 指令
  scripts/    -- 可执行脚本（确定性/重复任务）
  references/ -- 按需加载的参考文档
  assets/     -- 模板、图标、字体等资源
```

**渐进加载三层：**
1. Metadata (name + description) -- 始终在上下文（约 100 词）
2. SKILL.md body -- 触发时加载（理想 < 500 行）
3. Bundled resources -- 按需加载（不限量，脚本可直接执行不需加载）

**关键模式：**
- SKILL.md 控制在 500 行以内；接近上限时加层级 + 指引
- 多领域/框架的 skill，按变体组织 references/
- Description 要写"什么时候用"，稍微"推一推"让模型不会漏触发
- 用祈使句写指令
- 解释 why > 硬性 MUST

---

## AI Execution Notes

### Pacing
- Stage 1: 快速介绍 → 马上动手写 → 展示修改过程 → 这是最重的一步
- Stage 2: 每个体验都要**亲手做**，不是听说明
- Stage 3: 直接去外部市场，不在本地翻 → fork + 展示 diff
- Stage 4: 简短，交钥匙 → 结尾主动询问是否进入 Stage 5/6/7
- Stage 5: [可选] 先问清工作内容，再搜索筛选，输出结构化清单
- Stage 6: [可选] 先建文件夹，再演示一次转化，建立持续机制
- Stage 7: [可选] 确认用户有要迭代的 skill → 写测试 → 跑测试+baseline → 启动评审器 → 读反馈 → 改进 → 重复

### 关键原则
- **展示修改过程**：每次改 skill 后，用 diff 格式展示"改了什么 → 为什么 → 效果变化"
- **体验 > 说明**：三个体验环节必须让用户亲手操作或看到实际运行结果
- **外部优先**：Stage 3 探索环节直接搜外部市场（GitHub/skills.pub），不列本地 skill

### Anti-Patterns
- DO NOT 在 Stage 1 讲超过 5 句话的介绍
- DO NOT 默默修改 skill 不展示过程——修改过程就是教学
- DO NOT 在 Stage 3 用 `ls ~/.claude/skills/` 或 `ls ~/.codebuddy/skills/` 列本地 skill 给用户选
- DO NOT 跳过体验 2 的脚本实际运行——必须 `cat` + `bash` 当场演示
- DO NOT 跳过创建后的测试
- DO NOT 把"这是提示词吗"当成小问题——这是最重要的教学时刻
- DO NOT 在 Stage 5 不问用户工作内容就直接推荐——推荐必须基于用户实际需求
- DO NOT 在 Stage 5 推荐已经装过的 skill——必须先扫描已有 skill 做去重
- DO NOT 在 Stage 6 帮用户创建素材文件夹前不确认位置——让用户自己选放哪里
- DO NOT 在 Stage 6 只介绍不演示——必须当场从素材转化出至少一个 working skill
- DO NOT 在 Stage 7 跳过 baseline 对比——没有 baseline 的测试没有意义
- DO NOT 在 Stage 7 自己看完结果就改 skill——必须先用 generate_review.py 生成评审器让用户看
- DO NOT 在 Stage 7 为特定测试用例写死规则——改进必须泛化，不能过拟合

### Reference Files

Stage 7 使用以下参考文件（按需加载，不提前读入上下文）：

- `agents/grader.md` -- 评估 assertion 的子代理指令
- `agents/comparator.md` -- 盲比较两个输出的子代理指令
- `agents/analyzer.md` -- 分析基准结果和比较结果的子代理指令
- `references/schemas.md` -- evals.json、grading.json、benchmark.json 等完整 JSON schema
- `eval-viewer/generate_review.py` -- 生成评审查看器（定性输出 + 定量基准）
- `assets/eval_review.html` -- description 优化的触发测试集评审页面模板
- `scripts/run_loop.py` -- description 优化自动循环
- `scripts/aggregate_benchmark.py` -- 基准数据聚合
- `scripts/package_skill.py` -- skill 打包
