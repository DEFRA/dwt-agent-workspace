---
name: lib
description: Shared JavaScript modules for the other skills. Import these from a skill script. This is not a task to run on its own.
targets:
  - '*'
---
# Shared skill library

`atlassian.js`, `env.js`, `markdown.js`, and `tmp.js` in this directory are the modules the other skills import. A script imports them with `../../lib/<file>.js`. `tmp.js` is the `.tmp` folder for each fetch. The generated artifacts rule names those folders.

Edit the modules here, in `.rulesync/skills/lib/`. Generate copies them to `.cursor/skills/lib/` and `.claude/skills/lib/`.
