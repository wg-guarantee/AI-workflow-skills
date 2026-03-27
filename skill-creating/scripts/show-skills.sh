#!/usr/bin/env bash
# skill-creating: show installed skills across all skill directories
# Usage: bash scripts/show-skills.sh [--compact]
# Scans: ~/.claude/skills, ~/.codebuddy/skills, project-level

COMPACT=false
[[ "${1:-}" == "--compact" ]] && COMPACT=true

# All possible skill directories (~/.claude/skills first)
CANDIDATES=(
    "$HOME/.claude/skills"
    "$HOME/.codebuddy/skills"
)

# Also check project-level if in a git repo
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -n "$PROJECT_ROOT" ]]; then
    for sub in .claude/skills .codebuddy/skills; do
        [[ -d "$PROJECT_ROOT/$sub" ]] && CANDIDATES+=("$PROJECT_ROOT/$sub")
    done
fi

# Deduplicate by resolved path (bash 3 compatible)
SEEN_LIST=""
UNIQUE_DIRS=()
for d in "${CANDIDATES[@]}"; do
    [[ ! -d "$d" ]] && continue
    resolved=$(cd "$d" 2>/dev/null && pwd -P)
    [[ -z "$resolved" ]] && continue
    if echo "$SEEN_LIST" | grep -qF "|${resolved}|" 2>/dev/null; then
        continue
    fi
    SEEN_LIST="${SEEN_LIST}|${resolved}|"
    UNIQUE_DIRS+=("$d")
done

# Extract description — handles both inline and YAML multiline (>, |)
extract_desc() {
    local file="$1"
    python3 -c "
import sys, re
try:
    text = open(sys.argv[1]).read()
except:
    sys.exit(0)
m = re.match(r'^---\n(.*?)\n---', text, re.DOTALL)
if not m:
    sys.exit(0)
fm = m.group(1)
lines = fm.split('\n')
for i, line in enumerate(lines):
    if line.startswith('description:'):
        val = line[len('description:'):].strip().strip('\"').strip(\"'\")
        if val and val not in ('>', '|', '>-', '|-'):
            print(val)
            sys.exit(0)
        # Multiline: collect indented lines after
        parts = []
        for nxt in lines[i+1:]:
            if nxt and (nxt[0] == ' ' or nxt[0] == '\t'):
                parts.append(nxt.strip())
            else:
                break
        if parts:
            print(' '.join(parts))
        sys.exit(0)
" "$file" 2>/dev/null || true
}

total=0

for DIR in "${UNIQUE_DIRS[@]}"; do
    [[ ! -d "$DIR" ]] && continue

    dir_label="${DIR/#$HOME/~}"

    count=0
    output=""

    for skill_dir in "$DIR"/*/; do
        [[ -d "$skill_dir" ]] || continue
        skill_name=$(basename "$skill_dir")
        skill_file="$skill_dir/SKILL.md"

        # Skip internal dirs
        [[ "$skill_name" == _* ]] && continue

        if [[ ! -f "$skill_file" ]]; then
            output="$output  !! $skill_name (missing SKILL.md)\n"
            continue
        fi

        desc=$(extract_desc "$skill_file")

        # Truncate
        if [[ ${#desc} -gt 80 ]]; then
            desc="${desc:0:77}..."
        fi

        # Check for extras
        extras=""
        [[ -d "${skill_dir}scripts" ]] && [[ -n "$(ls -A "${skill_dir}scripts" 2>/dev/null)" ]] && extras="${extras} [scripts]"
        [[ -d "${skill_dir}references" ]] && [[ -n "$(ls -A "${skill_dir}references" 2>/dev/null)" ]] && extras="${extras} [refs]"
        [[ -d "${skill_dir}assets" ]] && [[ -n "$(ls -A "${skill_dir}assets" 2>/dev/null)" ]] && extras="${extras} [assets]"

        if $COMPACT; then
            output="$output  $skill_name${extras:+ $extras}\n"
        else
            output="$output  $skill_name\n"
            [[ -n "$desc" ]] && output="$output     $desc\n"
            [[ -n "$extras" ]] && output="$output    $extras\n"
            output="$output\n"
        fi

        count=$((count + 1))
    done

    if [[ $count -gt 0 ]]; then
        echo "=== $dir_label ($count skills) ==="
        echo ""
        printf "%b" "$output"
        total=$((total + count))
    fi
done

echo "=== Total: $total skills ==="
