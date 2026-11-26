---
name: create-jira-release
description: Create a Jira fix version (release) for NWM, SPI, or WOE. Assigns tickets, sets release stages, sets a one-sentence description, and writes the release note into the Release Notes section. Use when creating a Jira release. Use edit-jira-release to change a release that already exists.
targets:
  - '*'
---
# Create Jira release

Creates a Jira fix version. The release note lives in the **Release Notes** section on that fix version. It does not live in the description, and it is not a Confluence page. To change a release that already exists, use [edit-jira-release](../edit-jira-release/SKILL.md).

NWM, SPI, and WOE are the projects in the Jira project names rule. That rule says which project key to pass. There is no default. The note shape is the Jira release description rule.

## What goes where

| Part | Jira field | Input |
| --- | --- | --- |
| Release name | `name` | `--release-name` |
| Release date | `releaseDate` | `--release-date` (`YYYY-MM-DD`) |
| Release stages | version stages | `--stages` |
| Description | `description` | `--description-file` or `--description-text` |
| Release note | Release Notes section | `--release-notes-file` |
| Work items | `fixVersion` on each ticket | `--tickets` |

The description is one sentence and has no heading. The release note is the markdown file. The script names the section **Release Notes** and writes that file there. Do not put the release note, service versions, or headings in the description. The script rejects a description that starts a line with a heading or `Services and versions`.

## Release stages

Release stages are the ordered list in the create-release dialog. They are separate from the Status control, which only offers Release and Archive.

- **Planned** is always first. A new release starts there. Do not add a second stage named Unreleased.
- Custom stages go between Planned and Released. These teams use **Ext-Test**.
- **Released** is always last. That is the done state. Do not rename it to Production.
- The create default is `Planned,Ext-Test,Released`. Pass `--stages` to override it.
- The current stage cannot be removed. The script moves the release to Planned first when the current stage is not in the new list.
- Approvals before Released stay off.

## Parameters

| Parameter | Required | Example |
| --- | --- | --- |
| `--project` | Yes | `DWTC` |
| `--release-name` | Yes | `RoW enhancements v1` |
| `--release-date` | Yes | `2026-11-24` |
| `--stages` | No | `Planned,Ext-Test,Released` |
| `--tickets` | Yes | `DWTC-259,DWTC-260` |
| `--description-file` or `--description-text` | Yes | one sentence |
| `--release-notes-file` | When writing the note | `release-notes.md` |
| `--released` | No | mark the fix version released |
| `--dry-run` | No | validate only |

`--name` is an alias for `--release-name`. `--stages` must start with `Planned` and end with `Released`. Ticket assignment adds the fix version. It does not remove other fix versions from an issue.

## Workflow

### 1. Ask for test reports

Before drafting the release note, ask for Relevant Test Reports. Each report is a CDP link and a type of test, such as UAT, regression, compatibility, or perf-test. The user can say they have not run them or do not have them yet. Write `None` only in that case. Do not invent a link, and do not write `None` before they answer.

Ask once about External comms. Include a phase only when this release updates it or still needs an update.

Phase 1 (RoW) links [waste-tracking-service](https://github.com/DEFRA/waste-tracking-service). That line is the Receipt of Waste documentation. Ask whether these need an update:

- [Upcoming API changes](https://defra.github.io/waste-tracking-service/preview/api-upcoming-changes/), source `docs/api-upcoming-changes.md`
- the OpenAPI spec `docs/apiSpecifications/ReceiptAPI.yml`
- other documentation under `docs/` in `waste-tracking-service`

Write a bullet only for what the user says was updated or still needs an update. One answer can cover more than one of them. Link a pull request when the user gives one. Write `No change` or `None` only when the user says so. Do not invent a pull request. A change on `main` is what the preview site publishes, and that can happen before release day. When the user says the docs went out early, write `Already updated. Published early.`

Phase 2 (NWM) links [digital-waste-tracking-api-site](https://github.com/DEFRA/digital-waste-tracking-api-site). Name what was updated or what still needs an update. Write `No change` only when the user says there is nothing to update. Do not invent a change. Do not add a separate Receipt of Waste documentation heading.

### 2. Draft the two files

`.tmp/jira-releases/new/description.md`:

```markdown
A variety of non-breaking, Receipt of Waste API enhancements.
```

`.tmp/jira-releases/new/release-notes.md`:

The release note file follows the template in the Jira release description rule. A comment marks an optional part. Include that part only when this release has something to record there. Do not copy a comment, a placeholder, or an optional part that does not apply.

```markdown
## Description

- <one short sentence for a change in this release>

## Dates & Times

Release to ext-test scheduled for: <day, or empty>

Release to Production scheduled for: <day, or empty>

## Services and versions

<!-- optional: one bullet for each service this release deploys -->

- <repo> [<current>](https://github.com/DEFRA/<repo>/releases/tag/<current>) → [<next>](https://github.com/DEFRA/<repo>/releases/tag/<next>)

## Config changes

<!-- optional lines: one bullet per environment variable, or None -->

- <service> `<VARIABLE>` <added, updated, or removed> in <environments>

## Relevant Test Reports

<!-- optional lines: one bullet per report the user gave, or None -->

- [<type>](https://portal.cdp-int.defra.cloud/test-suites/test-results/<environment>/<version>/<test-suite>/<run-id>/index.html)

## External comms

<!-- optional phases: include a phase only when this release updates it -->

- Phase 1 (RoW) [waste-tracking-service](https://github.com/DEFRA/waste-tracking-service)
  - <what was updated, or what still needs an update> [<page>](<page url>)
- Phase 2 (NWM) [digital-waste-tracking-api-site](https://github.com/DEFRA/digital-waste-tracking-api-site)
  - <what was updated, or what still needs an update> [<page>](<page url>)
```

`Description` is the top of the note. Write short bullet sentences from the tickets, one for each change. Do not retell them.

The only dates in the note are those two scheduled-for lines. Write the day, such as `24 Nov 2026`, and leave a line empty when it is not scheduled. Do not add a time. Do not add `Release note created`, `Release to ext-test`, or `Release to Production`.

`--release-date` and `Release to Production scheduled for` are the same day. Set both. `Release to ext-test scheduled for` is a separate day.

The first version is what ext-test and prod are running. The second is the minted CDP version this release deploys. Link each version to `https://github.com/DEFRA/<repo>/releases/tag/<version>`. Leave a service off when this release does not change it.

A merge to `main` mints a new version for that repo. Each service and each test repo keeps its own versions. The version in a test-results URL is the test repo's version. It does not match the service versions, and that difference is expected.

`Config changes` lists each environment variable this release adds, changes, or removes. Write `None` when there are no config changes. Link the [cdp-app-config](https://github.com/DEFRA/cdp-app-config) file for a non-secret. For a secret added in CDP, name the variable, service, and environments, and do not write the value.

`Relevant Test Reports` is one bullet per run the user supplied. Keep the URL the user gave. Do not add a type they did not give, and do not leave a placeholder in the note.

`External comms` includes a phase only when this release updates it. Under that phase, one bullet for each thing the user says was updated or still needs an update. Link the page when one exists. Leave the link off when it does not. Do not invent a page URL. Do not add the other phase, and do not add a bullet they did not ask for.

### 3. Check for an existing release (create only)

```bash
node .cursor/skills/create-jira-release/scripts/check-existing-release.js \
  DWTC "RoW enhancements v1"
```

- **Exit 0** — safe to create
- **Exit 1** — that name already exists; use [edit-jira-release](../edit-jira-release/SKILL.md)

### 4. Create

```bash
node .cursor/skills/create-jira-release/scripts/create-release.js \
  --project DWTC \
  --release-name "RoW enhancements v1" \
  --release-date 2026-11-24 \
  --tickets "DWTC-259,DWTC-260" \
  --description-file .tmp/jira-releases/new/description.md \
  --release-notes-file .tmp/jira-releases/new/release-notes.md
```

The script writes the result to `.tmp/jira-releases/new/`. The generated artifacts rule names that folder.

### 5. Review output

| File | Contents |
| --- | --- |
| `manifest.json` | Version ID, URLs, tickets, description |
| `description-source.txt` | Description sent to Jira |
| `release-notes.md` | Note written to the Release Notes section, when provided |
| `assignments.json` | Per-ticket assign results |

Reads `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` from the workspace `.env`.

**Ask for user confirmation before creating a release** unless the caller skill already obtained it.

After the release is created, remind the user to post it in the private Slack channel [defra-dwt-releases](https://equalexperts.slack.com/archives/C0CHZR18GCF). Include the Jira release link.

## Scripts

| Script | Purpose |
| --- | --- |
| `create-release.js` | Create the fix version, set stages, assign tickets, write the Release Notes section |
| `set-release-stages.js` | Set release stages. Planned first, Released last |
| `write-release-notes.js` | Write markdown into the Release Notes section |
| `check-existing-release.js` | Detect a duplicate release name |
| `assign-issues.js` | Add the fix version to ticket keys |
| `format-description.js` | Convert the one-sentence description for the description field |
| `resolve-project-id.js` | Resolve a project key to a numeric ID |

## Examples

```
/create-jira-release --project DWTC --release-name "RoW enhancements v1" --release-date 2026-11-24 --tickets DWTC-259,DWTC-260 --description-file .tmp/jira-releases/new/description.md --release-notes-file .tmp/jira-releases/new/release-notes.md
```

## Important constraints

- **This skill creates a release. It does not update one.** `--version` is rejected. A duplicate name is [edit-jira-release](../edit-jira-release/SKILL.md)
- **Release name and date are required**
- **Never create a duplicate release name** — run `check-existing-release.js` first
- **Never write to Jira without user confirmation** (unless a parent skill already confirmed)
- **The description field is one sentence** — no headings, and no service versions
- **The note opens with Description as short bullet sentences.** One bullet per change. Do not retell the tickets
- **The release note goes in the Release Notes section** via `--release-notes-file`
- **Ask for Relevant Test Reports before writing the note.** Each one is a link and a type of test. If the user has not run them or does not have them yet, write `None`
- **`--release-date` and `Release to Production scheduled for` are the same day**
- **A test-results version belongs to the test repo.** A merge to `main` mints a version for that repo. It does not match the service versions
- **External comms is one section, with an optional Phase 1 (RoW) line and an optional Phase 2 (NWM) line.** Phase 1 links https://github.com/DEFRA/waste-tracking-service and records the Receipt of Waste docs. Phase 2 links https://github.com/DEFRA/digital-waste-tracking-api-site. Include a phase only when this release updates it. Write `No change` only when the user says so. When Phase 1 docs went out early, write `Already updated. Published early.`
- **Release stages start with Planned and end with Released.** The default middle stage is Ext-Test. Do not replace Released with Production, and do not add Unreleased beside Planned.
- **Do not create a Confluence release note**
- **After creating the release, remind the user to post it in the private Slack channel defra-dwt-releases:** https://equalexperts.slack.com/archives/C0CHZR18GCF
- **If any script fails, stop immediately** — report the exact error

## Related skills

- [edit-jira-release](../edit-jira-release/SKILL.md) — change a release that already exists
- [get-jira-release](../get-jira-release/SKILL.md) — read release metadata and work items after creation
- [get-jira-ticket](../get-jira-ticket/SKILL.md) — ticket details for release contents
- [get-pr-service-version](../get-pr-service-version/SKILL.md) — minted service versions for the release note
