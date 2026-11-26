---
name: edit-jira-release
description: Edit an existing Jira fix version (release) for NWM, SPI, or WOE. Changes the description, Release Notes section, release stages, date, name, or tickets on a release that already exists. Use when updating a Jira release, its release note, or its stages.
---

# Edit Jira release

Changes an existing Jira fix version. It does not create one. Use [create-jira-release](../create-jira-release/SKILL.md) for a new release.

Fetch the release with [get-jira-release](../get-jira-release/SKILL.md) immediately before editing, including when it was fetched earlier in the session. Read `release.txt`, `stages.txt`, `issues.txt`, `related-work.txt`, and `sections.txt` from that fetch, and draft the edit from those files. Change only the parts the user asked to change. Leave the description, Release Notes section, stages, date, and tickets alone when they were not part of the request.

NWM, SPI, and WOE are the projects in the Jira project names rule. That rule says which project key to pass. There is no default. The note shape is the Jira release description rule.

## What you can change

| Part | Input | Left unchanged when omitted |
| --- | --- | --- |
| Release name | `--release-name` | yes |
| Release date | `--release-date` (`YYYY-MM-DD`) | yes |
| Description | `--description-file` or `--description-text` | yes |
| Release note | `--release-notes-file` | yes |
| Release stages | `--stages` | yes |
| Work items | `--tickets` | yes. Passing tickets adds this fix version. It does not remove other fix versions. |
| Released flag | `--released` | yes. This flag marks the version released. |

The description is one sentence and has no heading. The release note is the markdown file. The script writes that file to the section titled **Release Notes**. Do not put the release note, service versions, or headings in the description.

## Release stages

Release stages are separate from the Status control. Pass `--stages` only when the stage list should change.

- **Planned** is always first. Do not add a second stage named Unreleased.
- Custom stages go between Planned and Released. These teams use **Ext-Test**.
- **Released** is always last. Do not rename it to Production.
- The current stage cannot be removed. The script moves the release to Planned first when the current stage is not in the new list.
- Approvals before Released stay off.

## Workflow

### 1. Fetch the current release

Run [get-jira-release](../get-jira-release/SKILL.md) now. Use the version ID and read `release.txt` (status, start date, release date), `stages.txt`, `issues.txt`, `related-work.txt`, and `sections.txt` from that fetch. Do not draft from an earlier copy.

If the Release Notes section has no Relevant Test Reports, ask before writing. Each report is a CDP link and a type of test, such as UAT, regression, compatibility, or perf-test. The user can say they have not run them or do not have them yet. Write `None` only in that case. Do not invent a link, and do not write `None` before they answer. Leave a section that already lists reports as it is, unless the user is changing those reports.

If the note already has a Description, leave it. Write one only when that opening summary is missing. Short bullet sentences, one for each change. Do not retell the tickets.

If the note does not already answer External comms, ask once. Include a phase only when this release updates it or still needs an update. Phase 1 (RoW) links [waste-tracking-service](https://github.com/DEFRA/waste-tracking-service). That line is the Receipt of Waste documentation: [Upcoming API changes](https://defra.github.io/waste-tracking-service/preview/api-upcoming-changes/) (`docs/api-upcoming-changes.md`), the OpenAPI spec `docs/apiSpecifications/ReceiptAPI.yml`, and other documentation under `docs/`. Write a bullet only for what the user says was updated or still needs an update. One answer can cover more than one of them. Link a pull request when the user gives one. Write `No change` or `None` only when the user says so. Do not invent a pull request. A change on `main` can be published before release day. When the user says the docs went out early, write `Already updated. Published early.` Phase 2 (NWM) links [digital-waste-tracking-api-site](https://github.com/DEFRA/digital-waste-tracking-api-site). Name what was updated or what still needs an update. Write `No change` only when the user says there is nothing to update. Do not invent a change. Do not add a separate Receipt of Waste documentation heading. Leave an answer that is already in the note, unless the user is changing it.

### 2. Draft only what is changing

`.tmp/jira-releases/<version-id>/description.md` when the description changes:

```markdown
A variety of non-breaking, Receipt of Waste API enhancements.
```

`.tmp/jira-releases/<version-id>/release-notes.md` when the Release Notes section changes. Keep the existing section text from the fetch and edit the part the user asked for. The only dates in the note are the two scheduled-for lines. Write the day, such as `24 Nov 2026`, and leave a line empty when it is not scheduled. Do not add a time. Do not add `Release note created`, `Release to ext-test`, or `Release to Production`.

The Jira release date and `Release to Production scheduled for` are the same day. When the edit changes either, set both from the fetched release. `Release to ext-test scheduled for` is a separate day.

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

The first version is what ext-test and prod are running. The second is the minted CDP version this release deploys. Link each version to `https://github.com/DEFRA/<repo>/releases/tag/<version>`. Leave a service off when this release does not change it.

A merge to `main` mints a new version for that repo. Each service and each test repo keeps its own versions. The version in a test-results URL is the test repo's version. It does not match the service versions, and that difference is expected.

`Config changes` lists each environment variable this release adds, changes, or removes. Write `None` when there are no config changes. Link the [cdp-app-config](https://github.com/DEFRA/cdp-app-config) file for a non-secret. For a secret added in CDP, name the variable, service, and environments, and do not write the value.

`Relevant Test Reports` is one bullet per run the user supplied. Keep the URL the user gave. Do not add a type they did not give, and do not leave a placeholder in the note.

`External comms` includes a phase only when this release updates it. Under that phase, one bullet for each thing the user says was updated or still needs an update. Link the page when one exists. Leave the link off when it does not. Do not invent a page URL. Do not add the other phase, and do not add a bullet they did not ask for.

### 3. Confirm, then edit

**Ask for user confirmation before writing to Jira** unless the caller skill already obtained it.

```bash
node .cursor/skills/edit-jira-release/scripts/edit-release.js \
  .tmp/jira-releases/48175 \
  --project DWTC \
  --version 48175 \
  --release-notes-file .tmp/jira-releases/48175/release-notes.md
```

Add `--description-file`, `--stages`, `--release-date`, `--release-name`, `--tickets`, or `--released` only for a part that should change. `--stages` looks like `Planned,Ext-Test,Released`.

`--dry-run` validates the arguments and writes nothing.

### 4. Review output

| File | Contents |
| --- | --- |
| `manifest.json` | Version ID, URL, and the fields this edit sent |
| `description-source.txt` | Description sent to Jira, when the description changed |
| `release-notes.md` | Note written to the Release Notes section, when provided |
| `assignments.json` | Per-ticket assign results, when tickets were added |

Reads `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` from the workspace `.env`.

### 5. Fetch again and check

Run [get-jira-release](../get-jira-release/SKILL.md) again. Read `release.txt`, `stages.txt`, `issues.txt`, `related-work.txt`, and `sections.txt`. The release date and `Release to Production scheduled for` are the same day. Status, stage, tickets, and related work match the edit. The note matches the edit, and content from the fetch in step 1 that this edit did not change is still there. If it does not match, stop and report the difference.

After the release is updated, remind the user to post it in the private Slack channel [defra-dwt-releases](https://equalexperts.slack.com/archives/C0CHZR18GCF). Include the Jira release link.

## Scripts

| Script | Purpose |
| --- | --- |
| `edit-release.js` | Update the fields passed in. This skill does not create a release. |

## Examples

```
/edit-jira-release --project DWTC --version 48175 --release-notes-file release-notes.md
/edit-jira-release --project DWTC --version 48316 --stages Planned,Ext-Test,Released
```

## Important constraints

- **Do not create a release here**
- **Fetch the current release with get-jira-release immediately before drafting the edit.** After writing, fetch again and check the result
- **The Jira release date and `Release to Production scheduled for` are the same day**
- **A test-results version belongs to the test repo.** A merge to `main` mints a version for that repo. It does not match the service versions
- **Change only the fields the user asked to change**
- **Never write to Jira without user confirmation** (unless a parent skill already confirmed)
- **The description field is one sentence** — no headings, and no service versions
- **Leave a Description that is already in the note.** Write one only when the opening summary is missing: short bullet sentences, one per change, without retelling the tickets
- **The release note goes in the Release Notes section** via `--release-notes-file`
- **Ask for Relevant Test Reports when the note has none.** Each one is a link and a type of test. If the user has not run them or does not have them yet, write `None`
- **External comms is one section, with an optional Phase 1 (RoW) line and an optional Phase 2 (NWM) line.** Ask when the note does not already answer. Phase 1 links https://github.com/DEFRA/waste-tracking-service and records the Receipt of Waste docs. Phase 2 links https://github.com/DEFRA/digital-waste-tracking-api-site. Include a phase only when this release updates it. Write `No change` only when the user says so. When Phase 1 docs went out early, write `Already updated. Published early.`
- **Release stages start with Planned and end with Released**
- **Do not create a Confluence release note**
- **After editing the release, remind the user to post it in the private Slack channel defra-dwt-releases:** https://equalexperts.slack.com/archives/C0CHZR18GCF
- **If any script fails, stop immediately** — report the exact error

## Related skills

- [get-jira-release](../get-jira-release/SKILL.md) — read the release before editing it
- [create-jira-release](../create-jira-release/SKILL.md) — create a new fix version
- [get-jira-ticket](../get-jira-ticket/SKILL.md) — ticket details for release contents
- [get-pr-service-version](../get-pr-service-version/SKILL.md) — minted service versions for the release note
