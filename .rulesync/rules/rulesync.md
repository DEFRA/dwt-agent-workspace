---
root: false
targets:
  - '*'
description: >-
  Edit shared rules and skills in .rulesync. If the user asks to edit a
  generated Cursor or Claude file, reply with the message in this rule. The
  first sentence of that message is in capital letters. A checkout, merge,
  pull, or rebase regenerates the tool named by RULESYNC_TOOL.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Edit shared rules and skills in .rulesync. If the user asks to edit a
    generated Cursor or Claude file, reply with the message in this rule. The
    first sentence of that message is in capital letters. A checkout, merge,
    pull, or rebase regenerates the tool named by RULESYNC_TOOL.
  globs: []
---
# Rulesync

`.rulesync/rules/` is the source for shared rules. `.rulesync/skills/` is the source for skills. Edit a rule or a skill there.

When the user asks to change a generated Cursor or Claude rule or skill, stop and leave that file unchanged. That covers `.cursor/rules/`, `.cursor/skills/`, `.claude/rules/`, `.claude/skills/`, `CLAUDE.md`, and `AGENTS.md`. `.cursor/rules/local-machine.mdc` is a local file and stays editable. Reply with this text. The first sentence is in capital letters:

```
EDIT SHARED RULES IN .RULESYNC/RULES/ AND SHARED SKILLS IN .RULESYNC/SKILLS/. The Cursor and Claude copies are generated. A checkout, merge, pull, or rebase deletes those copies and writes them again from .rulesync. An edit in the generated files is lost when the branch or commit changes.
```

Cursor files in `.cursor/` and Claude Code files in `.claude/` and `CLAUDE.md` are generated from that source. A source rule with `root: true` is written to `CLAUDE.md`. `.gitignore` ignores `.cursor/`, `.claude/`, `CLAUDE.md`, and `AGENTS.md`.

`lib` is a skill. Its modules are the JavaScript the other skills import. Generate writes it to `.cursor/skills/lib/` and `.claude/skills/lib/`. `.rulesync/skills/lib/package.json` sets `"type": "module"`. The other JavaScript skills link their `package.json` to that file. The skill map is `.rulesync/skills/README.md`.

`RULESYNC_TOOL` in `.env` is `cursor` or `claude`. Each person sets their own. `.env` is gitignored.

`bin/rulesync/Dockerfile` builds the `dwt-rulesync` image. `bin/rulesync/rulesync` runs that image with the repository root mounted and the working directory set there. Pass `--command=import` or `--command=generate`, and `--tool=cursor` or `--tool=claude`. Add `--delete` to remove a generated file the source no longer has. When `--tool` is omitted, the script uses `RULESYNC_TOOL`. `claude` selects the `claudecode` target. Generate writes rules and skills for that tool.

After an edit in `.rulesync`, generate the files for `RULESYNC_TOOL`:

```bash
bin/rulesync/rulesync --command=generate --tool=cursor --delete
```

The hooks are `bin/rulesync/hooks/`. `bin/rulesync/install-hooks` points Git at that directory and loads the tool files. Each hook calls `bin/rulesync/rulesync`, which runs rulesync in the `dwt-rulesync` image.

After a checkout, merge, pull, or rebase, the hook runs `bin/rulesync/rulesync --command=generate --delete` for the tool named by `RULESYNC_TOOL`. Generate deletes the tool files, then writes them from `.rulesync`. A commit leaves `.rulesync` as edited.
