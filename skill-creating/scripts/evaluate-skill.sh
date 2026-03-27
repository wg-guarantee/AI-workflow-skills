#!/bin/bash
# evaluate-skill.sh — 快速评估一个 skill 的质量
# 用法: bash evaluate-skill.sh <skill-directory>
# 输出：质量报告（结构检查 + 质量评分 + 建议）
set -euo pipefail

SKILL_DIR="${1:-}"

if [[ -z "$SKILL_DIR" || ! -d "$SKILL_DIR" ]]; then
  echo "Usage: bash evaluate-skill.sh <skill-directory>"
  echo "Example: bash evaluate-skill.sh ~/.codebuddy/skills/my-skill/"
  exit 1
fi

SKILL_MD="$SKILL_DIR/SKILL.md"
SKILL_NAME=$(basename "$SKILL_DIR")
SCORE=0
MAX_SCORE=100
ISSUES=()
STRENGTHS=()

echo "=========================================="
echo "  Skill 质量评估: $SKILL_NAME"
echo "=========================================="
echo ""

# === 1. 基础结构检查 (30分) ===
echo "📋 基础结构检查"
echo "---"

# SKILL.md 存在？
if [[ -f "$SKILL_MD" ]]; then
  echo "  ✅ SKILL.md 存在"
  SCORE=$((SCORE + 5))
else
  echo "  ❌ SKILL.md 不存在——这不是一个有效的 skill"
  ISSUES+=("缺少 SKILL.md 文件")
  echo ""
  echo "总分: 0/$MAX_SCORE — 无效 skill"
  exit 1
fi

# Frontmatter 检查
if head -1 "$SKILL_MD" | grep -q '^---'; then
  echo "  ✅ 有 YAML frontmatter"
  SCORE=$((SCORE + 5))

  # name 字段
  if grep -q '^name:' "$SKILL_MD"; then
    NAME_VAL=$(grep '^name:' "$SKILL_MD" | head -1 | sed 's/^name:\s*//' | tr -d ' ')
    if echo "$NAME_VAL" | grep -qE '^[a-z0-9-]+$'; then
      echo "  ✅ name 格式正确: $NAME_VAL"
      SCORE=$((SCORE + 5))
    else
      echo "  ⚠️  name 格式不规范: $NAME_VAL（应为小写+连字符）"
      ISSUES+=("name 应为 hyphen-case 格式")
      SCORE=$((SCORE + 2))
    fi
  else
    echo "  ❌ 缺少 name 字段"
    ISSUES+=("缺少 name 字段")
  fi

  # description 字段
  if grep -q '^description:' "$SKILL_MD"; then
    DESC=$(grep '^description:' "$SKILL_MD" | head -1 | sed 's/^description:\s*//')
    DESC_LEN=${#DESC}
    if [[ $DESC_LEN -gt 50 ]]; then
      echo "  ✅ description 足够详细 (${DESC_LEN}字)"
      SCORE=$((SCORE + 10))
      STRENGTHS+=("description 描述清晰")
    elif [[ $DESC_LEN -gt 20 ]]; then
      echo "  ⚠️  description 偏短 (${DESC_LEN}字)，建议更详细"
      ISSUES+=("description 偏短，应该说明什么时候用")
      SCORE=$((SCORE + 5))
    else
      echo "  ❌ description 太短 (${DESC_LEN}字)"
      ISSUES+=("description 太短，AI 无法判断何时触发")
      SCORE=$((SCORE + 2))
    fi

    # 检查 description 是否说了"何时用"
    if echo "$DESC" | grep -qiE 'when|trigger|use.*for|用于|触发|当.*时'; then
      echo "  ✅ description 包含触发条件"
      SCORE=$((SCORE + 5))
    else
      echo "  ⚠️  description 缺少触发条件（应写'什么时候用'而非'怎么工作'）"
      ISSUES+=("description 应写触发条件，不是工作流程")
    fi
  else
    echo "  ❌ 缺少 description 字段"
    ISSUES+=("缺少 description 字段")
  fi
else
  echo "  ❌ 没有 YAML frontmatter"
  ISSUES+=("缺少 YAML frontmatter")
fi

echo ""

# === 2. 内容质量检查 (40分) ===
echo "📝 内容质量检查"
echo "---"

BODY_LINES=$(wc -l < "$SKILL_MD" | tr -d ' ')
BODY_WORDS=$(wc -w < "$SKILL_MD" | tr -d ' ')

# 长度检查
if [[ $BODY_WORDS -gt 5000 ]]; then
  echo "  ⚠️  内容过长 (${BODY_WORDS}词)——可能塞了太多不需要的信息"
  ISSUES+=("内容过长，考虑把详细信息移到 references/")
  SCORE=$((SCORE + 5))
elif [[ $BODY_WORDS -gt 500 ]]; then
  echo "  ✅ 内容量适中 (${BODY_WORDS}词)"
  SCORE=$((SCORE + 10))
  STRENGTHS+=("内容量合适")
elif [[ $BODY_WORDS -gt 100 ]]; then
  echo "  ⚠️  内容偏少 (${BODY_WORDS}词)"
  ISSUES+=("内容偏少，可能缺少必要的指令")
  SCORE=$((SCORE + 5))
else
  echo "  ❌ 内容太少 (${BODY_WORDS}词)——可能只是占位符"
  ISSUES+=("内容太少，可能是未完成的模板")
  SCORE=$((SCORE + 2))
fi

# 有没有 TODO 占位符（排除引号内和说明性提及）
TODO_COUNT=$(grep -cE '^\[TODO|^#.*TODO|\bTODO:|\bTODO\]' "$SKILL_MD" 2>/dev/null; true)
TODO_COUNT=$(echo "$TODO_COUNT" | head -1 | tr -dc '0-9')
TODO_COUNT=${TODO_COUNT:-0}
if [[ "$TODO_COUNT" -gt 0 ]]; then
  echo "  ❌ 发现 $TODO_COUNT 个 TODO 占位符——skill 未完成"
  ISSUES+=("有 $TODO_COUNT 个 TODO 未完成")
else
  echo "  ✅ 无 TODO 占位符"
  SCORE=$((SCORE + 5))
fi

# 结构检查（有没有标题层级）
H2_COUNT=$(grep -c '^## ' "$SKILL_MD" 2>/dev/null || echo "0")
if [[ "$H2_COUNT" -ge 2 ]]; then
  echo "  ✅ 结构良好 ($H2_COUNT 个章节)"
  SCORE=$((SCORE + 10))
  STRENGTHS+=("有清晰的章节结构")
elif [[ "$H2_COUNT" -ge 1 ]]; then
  echo "  ⚠️  结构偏简单 ($H2_COUNT 个章节)"
  SCORE=$((SCORE + 5))
else
  echo "  ❌ 没有章节结构"
  ISSUES+=("缺少章节标题（## ），结构不清晰")
fi

# 有没有具体的指令（DO/DON'T/MUST/NEVER）
DIRECTIVE_COUNT=$(grep -ciE '\bMUST\b|\bNEVER\b|\bDO NOT\b|\bALWAYS\b|禁止|必须|铁律' "$SKILL_MD" 2>/dev/null || echo "0")
if [[ "$DIRECTIVE_COUNT" -ge 3 ]]; then
  echo "  ✅ 有明确的行为约束 ($DIRECTIVE_COUNT 条)"
  SCORE=$((SCORE + 10))
  STRENGTHS+=("有明确的约束规则")
elif [[ "$DIRECTIVE_COUNT" -ge 1 ]]; then
  echo "  ⚠️  行为约束较少 ($DIRECTIVE_COUNT 条)"
  SCORE=$((SCORE + 5))
else
  echo "  ℹ️  没有显式的行为约束（不一定是问题）"
  SCORE=$((SCORE + 3))
fi

# 有没有代码示例
CODE_BLOCK_COUNT=$(grep -c '```' "$SKILL_MD" 2>/dev/null || echo "0")
CODE_BLOCK_COUNT=$((CODE_BLOCK_COUNT / 2))
if [[ $CODE_BLOCK_COUNT -ge 2 ]]; then
  echo "  ✅ 包含代码示例 ($CODE_BLOCK_COUNT 个)"
  SCORE=$((SCORE + 5))
  STRENGTHS+=("有代码示例")
elif [[ $CODE_BLOCK_COUNT -ge 1 ]]; then
  echo "  ℹ️  少量代码示例 ($CODE_BLOCK_COUNT 个)"
  SCORE=$((SCORE + 3))
fi

echo ""

# === 3. 资源完整性 (20分) ===
echo "📦 资源完整性"
echo "---"

HAS_SCRIPTS=false
HAS_REFERENCES=false
HAS_ASSETS=false

if [[ -d "$SKILL_DIR/scripts" ]] && [[ $(find "$SKILL_DIR/scripts" -type f | wc -l) -gt 0 ]]; then
  SCRIPT_COUNT=$(find "$SKILL_DIR/scripts" -type f | wc -l | tr -d ' ')
  echo "  ✅ scripts/ 目录 ($SCRIPT_COUNT 个脚本)"
  SCORE=$((SCORE + 8))
  HAS_SCRIPTS=true
  STRENGTHS+=("带脚本——可复用的自动化")
else
  echo "  ℹ️  无 scripts/ 目录"
fi

if [[ -d "$SKILL_DIR/references" ]] && [[ $(find "$SKILL_DIR/references" -type f | wc -l) -gt 0 ]]; then
  REF_COUNT=$(find "$SKILL_DIR/references" -type f | wc -l | tr -d ' ')
  echo "  ✅ references/ 目录 ($REF_COUNT 个文件)"
  SCORE=$((SCORE + 6))
  HAS_REFERENCES=true
else
  echo "  ℹ️  无 references/ 目录"
fi

if [[ -d "$SKILL_DIR/assets" ]] && [[ $(find "$SKILL_DIR/assets" -type f | wc -l) -gt 0 ]]; then
  ASSET_COUNT=$(find "$SKILL_DIR/assets" -type f | wc -l | tr -d ' ')
  echo "  ✅ assets/ 目录 ($ASSET_COUNT 个文件)"
  SCORE=$((SCORE + 6))
  HAS_ASSETS=true
else
  echo "  ℹ️  无 assets/ 目录"
fi

# 纯 SKILL.md 也可以
if ! $HAS_SCRIPTS && ! $HAS_REFERENCES && ! $HAS_ASSETS; then
  echo "  ℹ️  纯 SKILL.md（无附加资源）——轻量级 skill"
  SCORE=$((SCORE + 5))
fi

echo ""

# === 4. 实用性信号 (10分) ===
echo "🎯 实用性信号"
echo "---"

# 引用了外部工具/API？
if grep -qiE 'curl|python|bash|npm|pip|API|endpoint' "$SKILL_MD"; then
  echo "  ✅ 引用了外部工具/API"
  SCORE=$((SCORE + 5))
fi

# 有错误处理/edge case？
if grep -qiE 'error|fail|edge.case|fallback|回退|错误|异常' "$SKILL_MD"; then
  echo "  ✅ 考虑了错误处理"
  SCORE=$((SCORE + 5))
  STRENGTHS+=("有错误处理/回退策略")
fi

echo ""

# === 最终报告 ===
echo "=========================================="
echo "  评估结果"
echo "=========================================="
echo ""

# 评级
if [[ $SCORE -ge 80 ]]; then
  GRADE="A — 高质量 ✅"
elif [[ $SCORE -ge 60 ]]; then
  GRADE="B — 良好 ⚠️"
elif [[ $SCORE -ge 40 ]]; then
  GRADE="C — 及格 ⚠️"
else
  GRADE="D — 需要改进 ❌"
fi

echo "  评分: $SCORE/$MAX_SCORE"
echo "  评级: $GRADE"
echo ""

if [[ ${#STRENGTHS[@]} -gt 0 ]]; then
  echo "  💪 优点:"
  for s in "${STRENGTHS[@]}"; do
    echo "     · $s"
  done
  echo ""
fi

if [[ ${#ISSUES[@]} -gt 0 ]]; then
  echo "  ⚠️  问题:"
  for i in "${ISSUES[@]}"; do
    echo "     · $i"
  done
  echo ""
fi

echo "=========================================="
