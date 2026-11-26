---
root: false
targets:
  - '*'
description: >-
  digital-waste-tracking-uat. Test assertion and error handling rules
globs:
  - 'repos/digital-waste-tracking-uat/**/*.test.js'
  - 'repos/digital-waste-tracking-uat/**/test/**/*.js'
  - 'repos/digital-waste-tracking-uat/**/specs/**/*.js'
cursor:
  alwaysApply: false
  description: >-
    digital-waste-tracking-uat. Test assertion and error handling rules
---
# Test Assertions & Error Handling

## Assertion Priority

- **Status Code First**: Always assert status code before other properties
- **Property Validation**: Use `toHaveProperty()` for checking response structure
- **Type Validation**: Use `expect.any(String)` for dynamic values like IDs
- **Async/Await**: Use async/await for all API calls

## Error Case Verification

- **Exact Error Matching**: For error cases, use `toEqual()` with exact expected structure
- **Receipt validation errors**: `/movements/receive` errors use `key`, `errorType`, and `message`
- **Collections beta problem details**: `/beta-1`, `/beta-2`, `/beta-3`, and later versions use `type`, `title`, `detail`, `instance`, and `requestId`. Assert `response.headers['x-request-id']` with `expect.any(String)`, then set `requestId` to that header. See `collections-beta.mdc`
- **Exact Return Body**: For error case tests, verify the exact return body structure
