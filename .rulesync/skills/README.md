# Skills

This directory is the source. `rulesync generate` writes each skill, including `lib`, to `.cursor/skills/` and `.claude/skills/`. Those copies are gitignored. `.rulesync/skills/lib/package.json` sets `"type": "module"`. The other JavaScript skills link their `package.json` to that file. The skill scripts rule says how a script is run. Jira and Confluence scripts load `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` from the workspace `.env`. Setup is the Atlassian credentials rule.

## Skill map

| Skill                                                                           | Invoke                                     | Role                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| [get-jira-ticket](get-jira-ticket/SKILL.md)             | `/get-jira-ticket DWT-624`                 | Read one Jira issue (+ comments, GitHub, related) |
| [get-jira-release](get-jira-release/SKILL.md)           | `/get-jira-release 38223`                  | Read a fix version: status, dates, stage, tickets, related work, and the note |
| [get-pr-service-version](get-pr-service-version/SKILL.md) | `/get-pr-service-version <pr_url>`       | Resolve CDP service version from merged PR        |
| [get-confluence-page](get-confluence-page/SKILL.md)     | `/get-confluence-page <id_or_url>`         | Read Confluence pages/folders                     |
| [create-jira-release](create-jira-release/SKILL.md)     | `/create-jira-release …`                   | Create a Jira release and its Release Notes section |
| [edit-jira-release](edit-jira-release/SKILL.md)         | `/edit-jira-release …`                     | Change an existing Jira release, its note, or its stages |
| [create-confluence-page](create-confluence-page/SKILL.md) | (manual)                                 | Generic Confluence create/update                  |
| [github-cli-via-docker](github-cli-via-docker/SKILL.md) | `/github-cli-via-docker`                   | Provide the `gh` command through the `dwt-gh` image |
| [rulesync](rulesync/SKILL.md)                           | `/rulesync`                                | Generate Cursor and Claude Code rules and skills through the `dwt-rulesync` image |
| [lib](lib/SKILL.md)                                     |                                            | Shared modules imported by the other skills       |
| [get-defra-team-repos](get-defra-team-repos/SKILL.md)   | `/get-defra-team-repos`                    | Save the user's DEFRA team repositories under `.tmp` |
| [seed-repos](seed-repos/SKILL.md)                       | `/seed-repos`                              | Clone the saved DEFRA team repositories into `repos/` |

Planning or writing API tests from a ticket stays in `digital-waste-tracking-uat`.

**Read skills** fetch data to `.tmp/` and return full contents — do not guess from memory.

**Write skills** draft locally first and require **user confirmation** before Jira/Confluence writes.

## Release workflow

NWM, SPI, and WOE releases are Jira fix versions. The description is one sentence. The release note is the **Release Notes** section on that fix version. Do not create a Confluence release note.

```text
create-jira-release
  → new fix version, tickets, one-sentence description
  → stages Planned, Ext-Test, Released
  → Release Notes section from --release-notes-file
  → remind the user to post in defra-dwt-releases

get-jira-release
  → edit-jira-release (fetch immediately before the edit; only the fields that change)
  → get-jira-release (fetch again and check the result)
```

## Shared conventions

- Credentials are read from the workspace `.env` (gitignored). Copy `.env.example` to `.env`
- Output under `.tmp/` follows the generated artifacts rule
- On script failure: stop and report the exact error
- Ticket keys: `DWT-*` and `DWTA-*` both appear in this programme; use the key from the ticket or release

## Dependencies between skills

```text
get-jira-ticket ──► get-pr-service-version
                └──► create-jira-release (service versions in the Release Notes section)

get-jira-release ──► edit-jira-release
                 └──► create-jira-release

get-confluence-page ──► create-confluence-page

get-defra-team-repos ──► seed-repos
```
