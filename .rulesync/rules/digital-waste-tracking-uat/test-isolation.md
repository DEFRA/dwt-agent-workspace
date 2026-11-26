---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-uat. Test isolation and parallel execution rules
globs:
  - 'repos/digital-waste-tracking-uat/**/*.test.js'
  - 'repos/digital-waste-tracking-uat/**/test/**/*.js'
  - 'repos/digital-waste-tracking-uat/**/specs/**/*.js'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-uat. Test isolation and parallel execution rules
---
# Test Isolation & Parallel Execution

- **Test Independence**: Each test should be independent and runnable in isolation
- **Parallel-Safe**: Tests should be safe for parallel execution
- **No Shared Test Data**: Do not share mutable payloads or results between tests. The run's organisation and API code are shared on purpose (see jest-setup.mdc)
- **Fresh Test Data**: Each test should generate fresh test data in `beforeEach` (see test-data.mdc for details)
- **Resource Cleanup**: Let Jest handle cleanup automatically
- **API Clients**: Create `globalThis.apis` in `beforeEach()` and close it in `afterEach()` (see jest-setup.mdc)
