---
root: false
targets:
  - '*'
description: Shareable generated files go in .tmp/generated
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Shareable generated files go in .tmp/generated
  globs: []
---
# Generated artifacts

A file generated for someone to open or share goes in `.tmp/generated/`. Keep the filename and tell the user the path. `.tmp/` is gitignored.

Fetched Jira, Confluence, and GitHub output stays in its own folder under `.tmp/`.
