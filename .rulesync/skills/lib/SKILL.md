---
name: lib
description: Shared JavaScript modules for the other skills. Import these from a skill script. This is not a task to run on its own.
targets:
  - '*'
---

# Shared skill library

`atlassian.js`, `env.js`, and `markdown.js` in this directory are the modules the other skills import. A script imports them with `../../lib/<file>.js`.

Edit the modules here, in `.rulesync/skills/lib/`. Generate copies them to `.cursor/skills/lib/` and `.claude/skills/lib/`.
