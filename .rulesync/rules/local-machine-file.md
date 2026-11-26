---
root: false
targets:
  - '*'
description: >-
  Machine-only notes live in gitignored local-machine.mdc. Copy the template to
  create it.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Machine-only notes live in gitignored local-machine.mdc. Copy the template
    to create it.
  globs: []
---
# Local machine file

`.cursor/rules/local-machine.mdc` is optional. It records what is true only on this machine, such as a missing tool, the command that replaces it, or how Docker runs here. `.cursor/` is gitignored, so this file is not committed.

Shared rules and skills stay the same for the whole team. A skill calls a tool by its name. The local file says how this machine runs that command. Follow the file when it is present. When it is absent, follow the shared skills.

Copy this template to `.cursor/rules/local-machine.mdc` and replace the example:

```markdown
---
description: Notes that are true only on this machine
alwaysApply: true
---

# Local machine

# Tool name

This machine has no `<tool>` on the host. Skills call `<tool>`. Run those commands with `<the command this machine uses>`.
```
