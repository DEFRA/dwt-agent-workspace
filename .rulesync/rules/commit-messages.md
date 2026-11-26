---
root: false
targets:
  - '*'
description: Commit subjects start with the Jira keys
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Commit subjects start with the Jira keys
  globs: []
---
# Commit messages

This rule applies to `dwt-agent-workspace`. It does not apply to a directory under `repos/`. The writing rules rule says that.

One short subject. Add one sentence in the body only when the subject cannot say why the change was made.

Start with the Jira ticket keys, as written. For more than one ticket, list every key first.

```
DWTC-364 Run beta-2 integration tests in CI

DWTC-364 DWTC-365 Run beta-2 tests and assert error arrays
```

Do not add checklists, todos, or test plans to the message.
