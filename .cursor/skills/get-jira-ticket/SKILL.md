---
name: get-jira-ticket
description: Get a Jira ticket's details (summary, description, comments, attachments, GitHub PRs/commits, epic, and related tickets) by ticket ID and save everything to .tmp for analysis. Use whenever another skill or task needs Jira ticket data in this repository.
---

# Get Jira ticket

Fetches a single issue and related context to `.tmp/jira-tickets/<ticket>/`. Used by release notes, UAT test creation, and ad-hoc analysis.

## Parameters

`args` is the Jira ticket ID, e.g. `DWT-624` or `DWTA-166`.

## Steps

1. From the repo root, create the output directory and run all scripts. Replace `<ticket>` with the ticket ID (e.g. `DWT-624`):

   ```bash
   mkdir -p .tmp/jira-tickets/<ticket>/attachments

   node .cursor/skills/get-jira-ticket/scripts/ticket.js <ticket> full > .tmp/jira-tickets/<ticket>/ticket.txt
   node .cursor/skills/get-jira-ticket/scripts/ticket.js <ticket> json > .tmp/jira-tickets/<ticket>/ticket.json
   node .cursor/skills/get-jira-ticket/scripts/comments.js <ticket> list > .tmp/jira-tickets/<ticket>/comments.txt
   node .cursor/skills/get-jira-ticket/scripts/comments.js <ticket> json > .tmp/jira-tickets/<ticket>/comments.json
   node .cursor/skills/get-jira-ticket/scripts/attachments.js <ticket> .tmp/jira-tickets/<ticket>/attachments
   node .cursor/skills/get-jira-ticket/scripts/github-dev.js <ticket> .tmp/jira-tickets/<ticket>
   node .cursor/skills/get-jira-ticket/scripts/related-tickets.js <ticket> .tmp/jira-tickets/<ticket>
   ```

   Reads `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` from the workspace `.env`.

   Output under `.tmp/jira-tickets/<ticket>/`:

   | File / folder                    | Contents                                                                   |
   | -------------------------------- | -------------------------------------------------------------------------- |
   | `ticket.txt` / `ticket.json`     | Primary issue                                                              |
   | `comments.txt` / `comments.json` | Primary issue comments                                                     |
   | `attachments/`                   | Downloaded attachment files                                                |
   | `github.txt` / `github.json`     | Linked PRs, commits, changed files, CI builds from Jira GitHub integration |
   | `related/index.txt`              | Why each related ticket was fetched                                        |
   | `related/<KEY>/`                 | Full ticket + comments for parent, linked issues, subtasks (max 10)        |
   | `epic/`                          | Epic description, comments, and sibling issue list (when an epic is found) |

2. **If any script fails, stop immediately.** Report the exact error to the user and ask them to fix credentials before retrying. Do not guess ticket contents from memory or scrape the Jira UI.

   Note: `github-dev.js` may return empty PR/commit sections if nothing is linked in Jira's development panel — that is not an error.

3. **Read every file** under `.tmp/jira-tickets/<ticket>/` — especially `comments.txt`, `github.txt`, `related/`, `epic/`, and `attachments/`. Acceptance criteria, PR changes, and scope often live in comments, GitHub links, the epic, or linked tickets.

4. Return the full contents to the caller. Do not summarise or filter — the caller needs complete ticket details to do its job.

## Scripts

| Script               | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `ticket.js`          | Issue details                                                                    |
| `comments.js`        | Issue comments                                                                   |
| `attachments.js`     | Download attachment files                                                        |
| `github-dev.js`      | GitHub PRs, commits, changed files, and CI builds (Jira dev-status API)          |
| `related-tickets.js` | Parent, linked issues, subtasks, and epic context (requires `ticket.json` first) |
| `epic-issues.js`     | List all issues in an epic (called by `related-tickets.js`)                      |

Set `JIRA_MAX_RELATED=20` to fetch more than the default 10 related tickets.

## Examples

```
/get-jira-ticket DWT-624
/get-jira-ticket DWTA-166
```

## Related skills

- [get-pr-service-version](../get-pr-service-version/SKILL.md) — minted versions for linked service PRs
- [get-jira-release](../get-jira-release/SKILL.md) — release containing this ticket
- [create-jira-release](../create-jira-release/SKILL.md) — create the release that contains this ticket
- [edit-jira-release](../edit-jira-release/SKILL.md) — change that release or its Release Notes section
