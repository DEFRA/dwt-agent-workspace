---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-uat. Module import and path alias rules
globs:
  - 'repos/digital-waste-tracking-uat/**/*.js'
  - 'repos/digital-waste-tracking-uat/**/*.mjs'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-uat. Module import and path alias rules
---
# Module Imports & Path Aliases

- **ES Module Imports**: Always use ES module syntax (`import`/`export`) instead of CommonJS
- **Path Aliases**: Use the `~` path alias (maps to the repo root) instead of deep relative imports, but only in `test/specs/`. `~` is resolved by Jest's `moduleNameMapper`, which does not apply to files Node loads directly (e.g. Jest `globalSetup`/`globalTeardown` and anything they import, such as `test/apis/` and `test/support/`), so use relative imports there. TODO: decide on an alias approach that also works outside the Jest runtime.
- **Jest Globals Import**: Always import Jest functions explicitly: `import { describe, it, expect, beforeEach } from '@jest/globals'`
- **Relative Import Depth**: Limit relative import depth to avoid `../../../` patterns
