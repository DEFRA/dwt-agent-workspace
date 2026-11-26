---
root: false
targets:
  - '*'
description: Branch names from Jira keys, then a short lowercase slug
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Branch names from Jira keys, then a short lowercase slug
  globs: []
---
# Branch names

This rule applies to `dwt-agent-workspace`. It does not apply to a directory under `repos/`. The writing rules rule says that.

Name a branch from the Jira ticket keys, as written, then a short lowercase slug with hyphens.

One ticket: `DWTC-XXX_short-description`

Example: `DWTC-364_run-beta-2-tests-in-ci`

Two or more tickets: join every key with underscores, then the slug.

`DWTC-XXX_DWTC-XXX_short-description`

Example: `DWTC-364_DWTC-365_beta-2-ci-and-error-assertions`
