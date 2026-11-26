---
name: get-jira-release
description: Get a Jira fix version (release) by version ID, release URL, or project + version name. Returns status, start date, release date, stage, tickets, related work, and the Release Notes section. Use when the user asks for release contents, fix version issues, release notes, or a Jira release report.
targets:
  - '*'
---
# Get Jira release

Reads a fix version and does not modify Jira. One fetch returns:

- status (Unreleased, Released, or Archived), start date, and release date
- release stage: the stage list and the current stage
- tickets assigned to the fix version
- Related work links
- the custom rich text section

Jira keeps one rich text section on the release page, separate from the description. These teams title it **Release Notes**. The REST description field does not include it. Related work is a separate list from that section. Status is the release state. Stage is the list that runs from Planned to Released.

## Parameters

`args` is one of:

| Input type   | Example                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------ |
| Release URL  | `https://eaflood.atlassian.net/projects/DWTA/versions/38223/tab/release-report-all-issues` |
| Version ID   | `38223`                                                                                    |
| Project+name | Project key `DWTA` and version name (second argument)                                      |

## Steps

1. From the repo root, fetch the release. Replace `<version>` with the ID or URL. This runs every read: status, dates, stage, tickets, related work, and the Release Notes section.

   ```bash
   node .cursor/skills/get-jira-release/scripts/fetch-release.js <version>
   ```

   For project key + version name:

   ```bash
   node .cursor/skills/get-jira-release/scripts/fetch-release.js DWTC "RoW enhancements v1"
   ```

   The script writes `.tmp/jira-releases/<version-id>/`. The generated artifacts rule names that folder.

   Reads `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` from the workspace `.env`.

   Output under `.tmp/jira-releases/<version-id>/`:

   | File / folder                    | Contents                                                         |
   | -------------------------------- | ---------------------------------------------------------------- |
   | `release.txt` / `release.json`   | Name, status, start date, release date, released flag, description |
   | `stages.txt` / `stages.json`     | Stage list and current stage                                     |
   | `issues.txt` / `issues.json`     | Tickets assigned to the release                                  |
   | `related-work.txt` / `related-work.json` | Related work links (title, category, URL)                 |
   | `sections.txt` / `sections.json` | Release Notes section (title, text, and ADF)                     |

2. **If any script fails, stop immediately.** Report the exact error to the user. Do not guess release contents from memory or scrape the Jira UI.

3. **Read every file** under `.tmp/jira-releases/<version-id>/`. Use `release.txt` for status, start date, and release date, `stages.txt` for the current stage, `issues.txt` for the tickets, `related-work.txt` for Related work, and `sections.txt` for the Release Notes section. An empty `sections.txt` body means the release has no custom section. `related-work.txt` says `No related work.` when the list is empty.

4. Return the full contents to the caller. Do not summarise or filter unless the user asked for a summary only.

## Scripts

| Script                  | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `fetch-release.js`      | Write `.tmp/jira-releases/<id>/`                     |
| `resolve-release-id.js` | Parse version ID from URL, ID, or project + name |
| `release.js`            | Status, start date, release date, description (`full`, `summary`, `json`) |
| `release-stages.js`     | Stage list and current stage                         |
| `release-issues.js`     | Tickets assigned to the fix version                  |
| `release-related-work.js` | Related work links                                 |
| `release-sections.js`   | Release Notes section (title, plain text, ADF)       |

Set `JIRA_RELEASE_MAX_ISSUES=100` to change pagination page size (default 100).

## Examples

```
/get-jira-release https://eaflood.atlassian.net/projects/DWTA/versions/38223/tab/release-report-all-issues
/get-jira-release 38223
/get-jira-release DWTA "Sprint 42 Release"
```

## Related skills

- [get-jira-ticket](../get-jira-ticket/SKILL.md) — full details for individual tickets from the release
- [get-pr-service-version](../get-pr-service-version/SKILL.md) — minted service versions for merged PRs linked to release tickets
- [create-jira-release](../create-jira-release/SKILL.md) — create a fix version and its Release Notes section
- [edit-jira-release](../edit-jira-release/SKILL.md) — change an existing fix version, its Release Notes section, or its stages
