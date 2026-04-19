# Claude Code — pota

The canonical agent-facing reference for this repo is
**`documentation/AGENTS.md`**. It holds project conventions, library
semantics, the commands table, repository layout, workflow, tests,
change heuristics, and pointers to deeper docs. Other AI tools that
follow the AGENTS.md convention (e.g. Aider) read it directly;
Claude Code reaches it via the `@` import at the bottom of this
file.

This file is for **Claude Code-specific extras only**:

- **Path-scoped rules** in `.claude/rules/` — each file declares the
  paths it applies to in its frontmatter; Claude Code loads them
  automatically when those paths are touched.
- **Project subagents** in `.claude/agents/` — invoke by name when
  the task matches, or let Claude delegate.

**When adding a new project rule, convention, command, or note,
write it to `documentation/AGENTS.md` — not here.** AGENTS.md is
the shared source of truth; this file should grow only when the
content is genuinely Claude Code-specific (a new `.claude/rules/`
file, a new subagent, a Claude Code feature).

@../documentation/AGENTS.md
