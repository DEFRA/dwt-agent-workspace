---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-uat. Test development rules index for Digital
  Waste Tracking UAT
globs:
  - 'repos/digital-waste-tracking-uat/**/*.test.js'
  - 'repos/digital-waste-tracking-uat/**/test/**/*.js'
  - 'repos/digital-waste-tracking-uat/**/specs/**/*.js'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-uat. Test development rules index for Digital
    Waste Tracking UAT
---
# Test Development Rules

This is the main index for test development rules. Individual rule categories are defined in separate files:

## Core Test Rules
- **test-focus.mdc** - Test focus and philosophy
- **test-structure.mdc** - Test structure and organization  
- **test-nesting-structure.mdc** - Four-level test nesting hierarchy (API > Feature > Behavior > Expectation)
- **test-patterns.mdc** - Test implementation patterns
- **test-isolation.mdc** - Test isolation and parallel execution
- **jest-setup.mdc** - Jest process boundaries, config timing, and API client lifetime

## Data & Environment
- **test-data.mdc** - Test data management and isolation
- **test-environment.mdc** - Environment and execution, environment variable management

## Assertions & API
- **test-assertions.mdc** - Test assertions, error handling, and assertion priority
- **api-usage.mdc** - API usage, configuration access, and authentication patterns
- **collections-beta.mdc** - Collections beta (`beta-1`, `beta-2`, `beta-3`, ...) client, payloads, lifecycle, and problem responses

## Organization & Quality
- **test-organization.mdc** - File naming and organization
- **module-imports.mdc** - Module import and path alias rules
- **code-quality.mdc** - Code quality and formatting

## Integration & Documentation
- **jira-integration.mdc** - JIRA integration, Allure reporting, and test tagging
- **jsdoc-typing.mdc** - JSDoc typing documentation standards
- **no-typescript.mdc** - TypeScript usage restrictions

Each rule file contains specific guidelines for its category and will be automatically applied to relevant files based on their glob patterns.
