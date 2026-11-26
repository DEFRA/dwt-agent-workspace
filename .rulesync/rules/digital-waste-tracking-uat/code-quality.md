---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-uat. Code quality and formatting rules
globs:
  - 'repos/digital-waste-tracking-uat/**/*.js'
  - 'repos/digital-waste-tracking-uat/**/*.mjs'
  - 'repos/digital-waste-tracking-uat/**/*.json'
  - 'repos/digital-waste-tracking-uat/**/*.md'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-uat. Code quality and formatting rules
---
# Code Quality & Formatting

- **Enforce Code Formatting**: Always run `npm run format` before committing code
- **Lint Before Commit**: Use `npm run lint` to catch code quality issues early
- **No Console Statements**: Avoid `console.log` statements in production code
- **Consistent Code Style**: Follow the established Prettier configuration
