---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-uat. Test focus and philosophy rules
globs:
  - 'repos/digital-waste-tracking-uat/**/*.test.js'
  - 'repos/digital-waste-tracking-uat/**/test/**/*.js'
  - 'repos/digital-waste-tracking-uat/**/specs/**/*.js'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-uat. Test focus and philosophy rules
---
# Test Focus & Philosophy

- **UAT-Focused**: Write functional/behavioral tests that verify user acceptance criteria, not extensive unit-test-style coverage
- **Fewer Tests**: Prefer fewer, comprehensive tests over many small unit tests
- **Behavioral Testing**: Focus on end-to-end user scenarios and business workflows
