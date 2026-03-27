#!/usr/bin/env bash
# skill-creating: ensure common skill dependencies are available
# Usage: bash scripts/ensure-deps.sh

set -e

echo "=== Skill 依赖检查 ==="
echo ""

check_and_install() {
    local name="$1"
    local pip_name="$2"
    local check_cmd="$3"

    if eval "$check_cmd" &>/dev/null; then
        echo "  ✓ $name"
    else
        echo "  ✗ $name — 正在安装..."
        pip install -q "$pip_name" && echo "  ✓ $name — 安装完成" || echo "  ✗ $name — 安装失败，请手动运行: pip install $pip_name"
    fi
}

echo "Python 库："
check_and_install "markitdown (PDF/文档转文本)" "markitdown[all]" "python -c 'import markitdown'"
check_and_install "pdfplumber (PDF 表格提取)" "pdfplumber" "python -c 'import pdfplumber'"
check_and_install "pypdf (PDF 基础操作)" "pypdf" "python -c 'import pypdf'"
check_and_install "Pillow (图片处理)" "Pillow" "python -c 'from PIL import Image'"

echo ""
echo "命令行工具："

if command -v pdftoppm &>/dev/null; then
    echo "  ✓ poppler (pdftoppm)"
else
    echo "  ✗ poppler — 请运行: brew install poppler"
fi

if command -v node &>/dev/null; then
    echo "  ✓ Node.js ($(node --version))"
else
    echo "  ✗ Node.js — 请运行: brew install node"
fi

echo ""
echo "=== 检查完成 ==="
