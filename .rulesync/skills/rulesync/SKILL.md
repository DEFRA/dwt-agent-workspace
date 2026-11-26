---
name: rulesync
description: Generates Cursor and Claude Code rules and skills from .rulesync through the dwt-rulesync Docker image. Use when editing shared rules or skills, running rulesync generate, or installing the rulesync git hooks.
targets:
  - '*'
---
# Rulesync

Shared rules live in `.rulesync/rules/`. Skills live in `.rulesync/skills/`. `rulesync generate` writes Cursor files under `.cursor/` and Claude Code files to `CLAUDE.md` and `.claude/`. `.gitignore` ignores `.cursor/`, `.claude/`, `CLAUDE.md`, and `AGENTS.md`. A source rule with `root: true` is written to `CLAUDE.md`. The rulesync rule says how those files stay in step with `.rulesync`.

`RULESYNC_TOOL` in `.env` is `cursor` or `claude`. `bin/rulesync/Dockerfile` builds the `dwt-rulesync` image. `RULESYNC_VERSION` is the rulesync release it installs. `bin/rulesync/rulesync` builds that image and runs generate at the repository root. Pass `cursor` or `claude`. `claude` selects the `claudecode` target. The features are `rules` and `skills`.

```bash
bin/rulesync/rulesync cursor
bin/rulesync/rulesync claude
```

The hooks are `bin/rulesync/hooks/`. Install them once per clone. That points Git at that directory and loads the tool named by `RULESYNC_TOOL`:

```bash
bin/rulesync/install-hooks
```

A commit deletes `.rulesync`, runs `rulesync import` for `RULESYNC_TOOL`, and stages `.rulesync`. After a checkout, merge, pull, or rebase, the hook runs `rulesync generate --delete` for that tool.
