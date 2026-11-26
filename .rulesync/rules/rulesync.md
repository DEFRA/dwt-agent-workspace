---
root: true
targets:
  - '*'
description: >-
  Shared rules and skills are written in .rulesync. An agent does not read or
  write .rulesync unless it is actively debugging or upgrading rulesync with the
  user. RULESYNC_TOOL in .env selects cursor or claude. Hooks load that tool and
  import its edits.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Shared rules and skills are written in .rulesync. An agent does not read or
    write .rulesync unless it is actively debugging or upgrading rulesync with
    the user. RULESYNC_TOOL in .env selects cursor or claude. Hooks load that
    tool and import its edits.
  globs: []
---
# Rulesync

`.rulesync/rules/` is the source for shared rules. `.rulesync/skills/` is the source for skills.

An agent does not read or write `.rulesync` unless it is actively debugging or upgrading rulesync with the user. Edit the generated rule or skill for the tool in use. A commit writes that edit back into `.rulesync`.

Cursor files in `.cursor/` and Claude Code files in `.claude/` and `CLAUDE.md` are generated from that source. A source rule with `root: true` is written to `CLAUDE.md`. `.gitignore` ignores `.cursor/`, `.claude/`, `CLAUDE.md`, and `AGENTS.md`.

`lib` is a skill. Its modules are the JavaScript the other skills import. Generate writes it to `.cursor/skills/lib/` and `.claude/skills/lib/`. `.rulesync/skills/lib/package.json` sets `"type": "module"`. The other JavaScript skills link their `package.json` to that file. The skill map is `.rulesync/skills/README.md`.

`RULESYNC_TOOL` in `.env` is `cursor` or `claude`. Each person sets their own. `.env` is gitignored.

`bin/rulesync/Dockerfile` builds the `dwt-rulesync` image. `bin/rulesync/rulesync` runs that image with the repository root mounted and the working directory set there. Pass `cursor` or `claude`. Generate writes rules and skills for that tool.

The hooks are `bin/rulesync/hooks/`. `bin/rulesync/install-hooks` points Git at that directory and loads the tool files. After a checkout, merge, pull, or rebase, the hook runs `bin/rulesync/sync-worktree`. That replaces the tool files from `.rulesync` on that commit.

A commit runs `bin/rulesync/import-ai-edits`. Edits in the tool files are written into `.rulesync` and staged. Edits in `.rulesync` stay there, and the hook reloads the tool files. When both changed since the last sync, the commit stops. Run `bin/rulesync/sync-worktree` to keep `.rulesync` and replace the tool files.
