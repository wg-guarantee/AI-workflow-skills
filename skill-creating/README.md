# Skill Creating

**From zero to Skill Builder in 15 minutes.** A hands-on skill that teaches you how to create, evaluate, and iterate on Claude Code / Codebuddy skills -- by actually building them.

## What is this?

This is a **skill** (a markdown-driven instruction set for AI coding assistants like Claude Code and Codebuddy). When loaded, it turns your AI into a personal skill-building coach that walks you through creating your first skill, exploring the skill marketplace, and engineering high-quality skills with tests and benchmarks.

---

## For AI -- How to install

Copy-paste the following to your AI assistant (Claude Code / Codebuddy / Cursor), it will install itself:

> Please install the skill-creating skill for me:
>
> ```bash
> git clone https://github.com/howoneai/skill-creating.git ~/.claude/skills/skill-creating
> ```
>
> After cloning, confirm installation by checking if `~/.claude/skills/skill-creating/SKILL.md` exists. Then teach me how to create skills -- start from Stage 0.

**Codebuddy users**: replace `~/.claude/` with `~/.codebuddy/`.

That's it. Your AI will clone the repo, verify the file, and immediately start teaching you.

---

## For humans -- How to use (and keep using)

### First time

1. Open a new conversation with your AI
2. Say **"teach me skills"** or **"I want to learn about skills"**
3. The AI activates this skill automatically and walks you through 5 stages -- from building your first skill to evaluating quality with benchmarks
4. You'll come out with at least one working skill you made yourself

### After the first time -- this skill keeps working

This is not a one-time tutorial. It stays installed and keeps being useful:

| Say this to your AI | What happens |
|---|---|
| "I want to create a new skill for X" | Walks you through the full creation flow -- scaffold, write, test |
| "Evaluate my skill" | Runs quality checks on structure, content, and trigger description |
| "Show me what skills are available" | Scans the marketplace and recommends skills for your workflow |
| "Optimize my skill's description" | Runs benchmark loops to improve when your skill gets triggered |
| "Set up a skill inbox" | Creates a folder where you drop materials -- AI turns them into skills |

Think of it as a **permanent skill-building toolkit** inside your AI. Install once, use whenever you need to create, improve, or discover skills.

---

## What you'll learn (Stage overview)

| Stage | What happens |
|-------|-------------|
| 0 | Open an interactive explainer page -- 30 seconds to get the big picture |
| 1 | Build your first working skill from scratch |
| 2 | Experience 3 things skills can do that plain prompts can't |
| 3 | Find, evaluate, and fork skills from the community marketplace |
| 4 | Graduate with a cheat sheet and daily workflow |
| 5+ | (Optional) Personalized recommendations, skill inbox, benchmark engineering |

## Included tools

```
scripts/
  init_skill.py           # Scaffold a new skill
  show-skills.sh          # List all installed skills across directories
  evaluate-skill.sh       # Auto-evaluate skill quality (structure + content)
  package_skill.py        # Package a skill for sharing
  run_loop.py             # Description trigger-rate optimization loop
  aggregate_benchmark.py  # Aggregate benchmark data across iterations

agents/
  grader.md               # Sub-agent for evaluating test assertions
  comparator.md           # Blind comparison sub-agent
  analyzer.md             # Benchmark analysis sub-agent

assets/
  skill-explainer.html    # Interactive visual explainer
  eval_review.html        # Description optimization review page
```

## License

Apache 2.0
