---
name: rulesync
description: Edit shared rules and skills in .rulesync, then generate Cursor or Claude Code files through the dwt-rulesync Docker image. Use when editing shared rules or skills, running rulesync generate, or installing the rulesync git hooks.
targets:
  - '*'
---
# Rulesync

Edit shared rules in `.rulesync/rules/` and skills in `.rulesync/skills/`. `rulesync generate` writes Cursor files under `.cursor/` and Claude Code files to `CLAUDE.md` and `.claude/`. `.gitignore` ignores `.cursor/`, `.cursorignore`, `.claude/`, `CLAUDE.md`, and `AGENTS.md`. A source rule with `root: true` is written to `CLAUDE.md`. The rulesync rule says when those files are regenerated, and the reply to give when the user asks to edit a generated file. The first sentence of that reply is in capital letters.

`RULESYNC_TOOL` in `.env` is `cursor` or `claude`. `bin/rulesync/Dockerfile` builds the `dwt-rulesync` image. `RULESYNC_VERSION` is the rulesync release it installs. `bin/rulesync/rulesync` builds that image and runs at the repository root. Pass `--command=import` or `--command=generate`, and `--tool=cursor` or `--tool=claude`. Add `--delete` to remove a generated file the source no longer has. When `--tool` is omitted, the script uses `RULESYNC_TOOL`. `claude` selects the `claudecode` target. The features are `rules`, `skills`, and `ignore`. `.rulesync/.aiignore` lists `repos/*/env.sh`. The rulesync rule says where generate writes that list.

```bash
bin/rulesync/rulesync --command=generate --tool=cursor --delete
bin/rulesync/rulesync --command=generate --tool=claude --delete
```

After an edit in `.rulesync`, generate the tool named by `RULESYNC_TOOL`:

```bash
bin/rulesync/rulesync --command=generate --delete
```

The hooks are `bin/rulesync/hooks/`. Install them once per clone. That points Git at that directory and loads the tool named by `RULESYNC_TOOL`:

```bash
bin/rulesync/install-hooks
```

After a checkout, merge, pull, or rebase, the hook runs `bin/rulesync/rulesync --command=generate --delete` for the tool named by `RULESYNC_TOOL`. A commit leaves `.rulesync` as edited.
