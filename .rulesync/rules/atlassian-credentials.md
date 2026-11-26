---
root: false
targets:
  - '*'
description: >-
  Atlassian secrets and optional skill settings live in a gitignored .env at the
  workspace root
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Atlassian secrets and optional skill settings live in a gitignored .env at
    the workspace root
  globs: []
---
# Atlassian credentials

`ATLASSIAN_USER` and `ATLASSIAN_TOKEN` live in `.env` at the workspace root. `.env` is gitignored. Each person uses their own token. Do not commit it, and do not put a token in a rule, a doc, or chat.

```bash
cp .env.example .env
```

| Variable | Required | Value |
| --- | --- | --- |
| `ATLASSIAN_USER` | yes | Atlassian account email |
| `ATLASSIAN_TOKEN` | yes | API token from https://id.atlassian.com/manage-profile/security/api-tokens |
| `ATLASSIAN_BASE_URL` | no | Defaults to `https://eaflood.atlassian.net` |
| `CONFLUENCE_BASE_URL` | no | Defaults to `https://eaflood.atlassian.net/wiki` |
| `GITHUB_ORG` | no | Defaults to `DEFRA`. Used when a pull request is given as a repo name only |
| `JIRA_MAX_RELATED` | no | Defaults to `10` |
| `JIRA_RELEASE_MAX_ISSUES` | no | Defaults to `100` |
| `JIRA_RELEASE_DESCRIPTION_FORMAT` | no | Defaults to `markdown` |
| `JIRA_RELATED_WORK_CATEGORY` | no | Defaults to `Documentation` |
| `CONFLUENCE_MAX_FOLDER_PAGES` | no | Defaults to `50` |
| `CONFLUENCE_SEARCH_LIMIT` | no | Defaults to `25` |
| `CONFLUENCE_MAX_CHILDREN` | no | Defaults to `10` |

`.env.example` lists every variable a skill reads. A line that is commented out leaves the default in the script.

`ATLASSIAN_USER` and `ATLASSIAN_TOKEN` are sent only as an Authorization header. Scripts do not print them and do not write them to `.tmp`. GitHub calls use the logged-in `gh` command. There is no GitHub token in `.env`.

Create the Atlassian token with "Create API token", not a scoped token, so it covers Jira and Confluence.

Skill scripts load `.env` through `.cursor/skills/lib/env.js`. When `.env` exists, the scripts use the values in that file, even when a value is blank. When `.env` is missing, a script uses variables already in the environment, then stops if the Atlassian variables are still empty.

If a script says the variables are missing, tell the user to copy `.env.example` to `.env` and fill in both Atlassian values. Do not ask them to export those variables in a shell profile.
