---
root: false
targets:
  - '*'
description: >-
  How to add or edit a Cursor rule. Keep it short, generic, and light in
  context.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    How to add or edit a Cursor rule. Keep it short, generic, and light in
    context.
  globs: []
---
# Writing rules

Write plain sentences that a person and an agent can follow. Finish each thought. Name the thing instead of leaving "it" or "one" unclear.

A rule states the decision, command, mapping, link, or template. Cut a sentence that repeats another rule.

A rule that changes what the agent does on any turn is `alwaysApply: true`. A long rule for one task is not always on. A short always-on rule names that file and when to read it.

Those always-on rules apply to `dwt-agent-workspace`. They do not apply to a directory under `repos/`. When the work is in `repos/<name>`, follow that repository. The waste tracking phases rule still applies there.

Shared rules are for the whole team. Write a shared rule in `.rulesync/rules/`. The rulesync rule says how generate copies it for Cursor or Claude. Call a tool by its name. Something that is true only on one machine goes in `.cursor/rules/local-machine.mdc`. The local machine file rule says how to write that file.

One rule owns a detail. When another rule needs that detail, it points at the rule that owns it.

Tightening the wording leaves the decision in place. When a decision changes, update the rule and append the revision log.
