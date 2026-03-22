#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill from template
(Source: Anthropic skill-creator, adapted for skill-creating)

Usage:
    init_skill.py <skill-name> --path <path>

Examples:
    init_skill.py my-new-skill --path ~/.codebuddy/skills
    init_skill.py my-api-helper --path ~/.claude/skills
"""

import sys
import os
from pathlib import Path


def safe_print(message):
    """Print message safely, handling emoji encoding issues."""
    try:
        print(message)
    except UnicodeEncodeError:
        import re
        clean_message = re.sub(r'[\U0001F300-\U0001F9FF]', '', message)
        print(clean_message.strip())


SKILL_TEMPLATE = """---
name: {skill_name}
description: [TODO: Write WHEN to use this skill, not HOW it works. Example: "Use when summarizing long documents, articles, or meeting notes"]
---

# {skill_title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## [TODO: Main section - choose structure]

[TODO: Add your instructions here. Remember:
- Write what AI doesn't already know
- Use MUST/NEVER/DO NOT for hard rules
- Include code examples if applicable
- Keep SKILL.md lean, put details in references/]
"""


def title_case_skill_name(skill_name):
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name, path):
    skill_dir = Path(path).expanduser().resolve() / skill_name

    if skill_dir.exists():
        safe_print(f"❌ Error: Skill directory already exists: {skill_dir}")
        return None

    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
        safe_print(f"✅ Created skill directory: {skill_dir}")
    except Exception as e:
        safe_print(f"❌ Error creating directory: {e}")
        return None

    skill_title = title_case_skill_name(skill_name)
    skill_content = SKILL_TEMPLATE.format(skill_name=skill_name, skill_title=skill_title)

    skill_md_path = skill_dir / 'SKILL.md'
    try:
        skill_md_path.write_text(skill_content)
        safe_print("✅ Created SKILL.md")
    except Exception as e:
        safe_print(f"❌ Error creating SKILL.md: {e}")
        return None

    # Create optional directories (empty, user fills as needed)
    for subdir in ['scripts', 'references', 'assets']:
        (skill_dir / subdir).mkdir(exist_ok=True)
    safe_print("✅ Created scripts/, references/, assets/ directories")

    safe_print(f"\n✅ Skill '{skill_name}' initialized at {skill_dir}")
    print("\nNext steps:")
    print("1. Edit SKILL.md — fill in description and instructions")
    print("2. Add scripts/references/assets as needed (delete empty dirs)")
    print("3. Test with a real task")
    return skill_dir


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Usage: init_skill.py <skill-name> --path <path>")
        print("\nExamples:")
        print("  init_skill.py my-skill --path ~/.codebuddy/skills")
        print("  init_skill.py my-skill --path ~/.claude/skills")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    safe_print(f"🚀 Initializing skill: {skill_name}")
    result = init_skill(skill_name, path)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
