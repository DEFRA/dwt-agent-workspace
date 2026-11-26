# AI revision log

What changed locally, in the order it happened, so a later change can be unpicked. The current configuration is the Cursor rules. `changes/todo/` is open work. `changes/done/` is finished work.

This workspace is the git repository `dwt-agent-workspace`. It orchestrates work across the service repositories in `repos/`. This log records local changes made in this workspace. It does not record changes other people make in the repositories.

Append the next numbered section when a local decision moves or how a repository in this workspace runs changes. Leave older sections as they were. Each section names the local user and the UTC time from `date -u`. Do not record a commit. Then say what changed, concretely enough to unpick, and which rule or note it covers.

## 1. Revision log

Lewis Magri, 2026-11-11 13:26 UTC, workspace root, no base commit

Created `changes/` at the workspace root, with `todo/`, `done/`, and this log, so later changes are appended here. Added `.cursor/rules/todo-done-log.mdc`.

A repository that already keeps its own `changes/` records work inside that repository there. This folder is for work that spans repositories, and for repositories that do not keep their own.

Covers: `.cursor/rules/todo-done-log.mdc`.

## 2. Local log, no git

Lewis Magri, 2026-11-11 13:29 UTC

This workspace is for personal use. It orchestrates work across the repositories. It is not a git project, so a log entry does not record a commit and git commands are not part of writing one.

The log records local changes made in this workspace. It does not record changes other people make in the repositories.

Covers: `.cursor/rules/todo-done-log.mdc`, `.cursor/rules/git-branches.mdc`.

## 3. Jira, Confluence, and GitHub skills

Lewis Magri, 2026-11-11 13:34 UTC

Copied the Jira, Confluence, and GitHub skills from `digital-waste-tracking-uat` into `.cursor/skills/`: `get-jira-ticket`, `get-jira-release`, `get-pr-service-version`, `get-confluence-page`, `create-jira-release`, `create-release-note-in-confluence`, and `create-confluence-page`. Copied `docs/ai/atlassian-credentials.md` with them. `.tmp/` is scratch output and is listed in `.gitignore`.

`create-uat-tests-from-jira` and the UAT test rules stay in `digital-waste-tracking-uat`. They write tests for that repository.

Covers: `.cursor/rules/atlassian-skills.mdc`, `.cursor/skills/README.md`.

## 4. No test plans in pull request descriptions

Lewis Magri, 2026-11-17 21:19 UTC

Added `.cursor/rules/pull-request-descriptions.mdc`. PR bodies stay a short summary of what changed and why. Do not add a Test plan section or verification checklist — this workspace is QA-led, and the suite/CI cover verification.

Covers: `.cursor/rules/pull-request-descriptions.mdc`.

## 5. Internal names to Jira boards

Lewis Magri, 2026-11-23 14:01 UTC

Added `.cursor/rules/jira-project-names.mdc`. NWM is Jira project DWTC. SPI is DWTSPI, board 03 Delivery (14179). WOE is DR, board WOE board (16635). Releases for these three teams are Jira fix versions on that project, not Confluence pages.

Pointed `.cursor/rules/atlassian-skills.mdc` at that mapping.

Covers: `.cursor/rules/jira-project-names.mdc`, `.cursor/rules/atlassian-skills.mdc`.

## 6. NWM board

Lewis Magri, 2026-11-23 14:02 UTC

Set the NWM board in `.cursor/rules/jira-project-names.mdc` to DWT Collections Kanban, board 15782 on project DWTC. The Jira board title is still DWT Collections Kanban. National Waste Movements is the internal name for that board.

Covers: `.cursor/rules/jira-project-names.mdc`.

## 7. Shared Jira release description

Lewis Magri, 2026-11-23 14:04 UTC

Added `.cursor/rules/jira-release-description.mdc` from DWTC release 48175, RoW enhancements v1. The description is one summary sentence, then a Services and versions list. The same shape is for NWM, SPI, and WOE. Each version links to its GitHub tag. The first version is what ext-test and prod are running. The second is the version this release deploys.

Pointed `.cursor/rules/atlassian-skills.mdc` at that rule.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/atlassian-skills.mdc`.

## 8. Release Notes section title

Lewis Magri, 2026-11-23 14:30 UTC

The Release notes body is the rich text section on the Jira release, not the description. Name that section `Release Notes`. Read and write it with Jira GraphQL: `jira.versionById.richTextSection`, `jira.updateJiraVersionRichTextSectionTitle`, and `jira.updateJiraVersionRichTextSectionContent`. Do not put the version list in the description.

Covers: `.cursor/rules/jira-release-description.mdc`.

## 9. Release notes stay in Jira

Lewis Magri, 2026-11-23 14:35 UTC

Release notes are no longer Confluence pages. `create-jira-release` writes `--release-notes-file` to the Release Notes section and keeps the description to one sentence. `create-release-note-in-confluence` is retired. The skill map, related skill links, `docs/ai/atlassian-credentials.md`, and `.cursor/rules/atlassian-skills.mdc` point at that Jira section.

Covers: `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/create-jira-release/scripts/create-release.sh`, `.cursor/skills/create-jira-release/scripts/write-release-notes.py`, `.cursor/skills/create-release-note-in-confluence/SKILL.md`, `.cursor/skills/README.md`, `.cursor/rules/atlassian-skills.mdc`, `docs/ai/atlassian-credentials.md`.

## 10. Read the Release Notes section

Lewis Magri, 2026-11-23 14:37 UTC

`get-jira-release` now reads the custom rich text section as well as the description and work items. `release-sections.sh` writes `sections.txt` and `sections.json`. Jira has one section per fix version. Its title is the name set on the release page.

Covers: `.cursor/skills/get-jira-release/SKILL.md`, `.cursor/skills/get-jira-release/scripts/release-sections.sh`, `.cursor/skills/get-jira-release/scripts/release-sections.py`.

## 11. Release stages

Lewis Magri, 2026-11-23 14:55 UTC

`create-jira-release` sets release stages. Planned is first, Released is last, and the default middle stage is Ext-Test. Do not add Unreleased beside Planned, and do not rename Released to Production. A create uses that list unless `--stages` is passed. An update leaves the stages unchanged unless `--stages` is passed.

Covers: `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/create-jira-release/scripts/create-release.sh`, `.cursor/skills/create-jira-release/scripts/set-release-stages.py`.

## 12. Edit an existing release

Lewis Magri, 2026-11-23 15:00 UTC

Editing a Jira release is `edit-jira-release`. Creating one stays `create-jira-release`. An edit changes only the fields passed: description, Release Notes section, stages, date, name, or tickets. Stages still start with Planned and end with Released. Ext-Test is not applied on edit unless `--stages` includes it.

Covers: `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/scripts/edit-release.sh`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/README.md`, `.cursor/rules/atlassian-skills.mdc`, `docs/ai/atlassian-credentials.md`.

## 13. Scheduled dates only

Lewis Magri, 2026-11-23 15:04 UTC

The Release Notes template keeps two dates: `Release to ext-test scheduled for` and `Release to Production scheduled for`. Each value is a day, such as `19 Nov 2026`, with no time. Leave a line empty when it is not scheduled. Do not add `Release note created`, `Release to ext-test`, or `Release to Production`.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 14. Config changes

Lewis Magri, 2026-11-23 15:34 UTC

The Release Notes template has a Config changes section. One bullet per environment variable the release adds, changes, or removes. A non-secret links to its file in cdp-app-config. A secret is named as a CDP secret, with the service and environments, and the value is not written in the note. Write None when there are no config changes.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 15. Relevant Test Reports

Lewis Magri, 2026-11-23 15:36 UTC

The Release Notes template has a Relevant Test Reports section. One bullet per CDP test suite report. The label is the kind of run, such as UAT, regression, compatibility, or perf-test. The link is `https://portal.cdp-int.defra.cloud/test-suites/report/<environment>/<test-suite>/<run-id>/index.html`. Leave off a kind that was not run. Write None when there are no reports.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 16. Ask for test reports

Lewis Magri, 2026-11-23 15:38 UTC

Creating a release asks for Relevant Test Reports before the note is written. Editing a release asks when that section has no reports. Each report is a CDP link and a type of test. The user can say they have not run them or do not have them yet, and only then is the section `None`. Do not invent a link.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 17. Phase 1 documentation

Lewis Magri, 2026-11-23 15:51 UTC

A Receipt of Waste (Phase 1) release note records whether the upcoming API changes page, the OpenAPI spec, and the other docs in `waste-tracking-service` need an update. The page is `docs/api-upcoming-changes.md`, published at `https://defra.github.io/waste-tracking-service/preview/api-upcoming-changes/`. The spec is `docs/apiSpecifications/ReceiptAPI.yml`. Creating a release asks. Editing a release asks when the note does not already say. Link each pull request. Write `No change` or `None` only when the user says so. Leave the section out of a Phase 2 release.

Covers: `.cursor/rules/waste-tracking-phases.mdc`, `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 18. Release note summary

Lewis Magri, 2026-11-23 15:52 UTC

The Release Notes section opens with Description. It is a few lines summarising what the tickets change. It is not the one-sentence description field, and it does not retell the tickets. A Description that is already written stays as it is.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 19. Description bullets

Lewis Magri, 2026-11-23 15:53 UTC

The Description at the top of the Release Notes section is short bullet sentences, one per change. It is not one sentence. A Description that is already written stays as it is. The description field on the fix version is still one sentence.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 20. Fetch the release before an edit

Lewis Magri, 2026-11-23 16:01 UTC

An edit starts by fetching the current release with get-jira-release, including when it was fetched earlier in the session. The draft uses that fetch: description, Release Notes section, and work items.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/skills/README.md`.

## 21. External comms

Lewis Magri, 2026-11-23 16:01 UTC

The Release Notes template has an External comms section. Creating a release asks whether external comms need an update. Editing a release asks when the note does not already answer. A Receipt of Waste (Phase 1) release uses https://defra.github.io/waste-tracking-service. A National Waste Movements (Phase 2) release uses https://github.com/DEFRA/digital-waste-tracking-api-site. When the answer is yes, the note links that site and names the change. `No change` is written only when the user says there is nothing to update.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/waste-tracking-phases.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 22. Release date is the production day

Lewis Magri, 2026-11-23 16:18 UTC

The Jira release date and `Release to Production scheduled for` are the same day. Changing either sets both. `Release to ext-test scheduled for` stays its own day. RoW enhancements v1 uses 24 Nov 2026.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/scripts/edit-release.sh`.

## 23. Test results URL and separate versions

Lewis Magri, 2026-11-23 16:18 UTC

A CDP test link is `https://portal.cdp-int.defra.cloud/test-suites/test-results/<environment>/<version>/<test-suite>/<run-id>/index.html`. A run can come from any test repo executed in CDP. Keep the URL the user gave. A merge to `main` mints a version for that repo. Service repos and test repos each keep their own versions. The version in a test-results URL is the test repo's version, and it is not expected to match the service versions.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/skills/get-pr-service-version/SKILL.md`, `.cursor/skills/get-pr-service-version/scripts/pr-version.sh`.

## 24. Docs can go out before release day

Lewis Magri, 2026-11-23 16:18 UTC

Phase 1 docs publish from `main`, so they can go out before the release date. When that has happened, the Receipt of Waste documentation section says `Already updated. Published early.`

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/waste-tracking-phases.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 25. Check the release after a write

Lewis Magri, 2026-11-23 16:18 UTC

An edit is built from a fresh get-jira-release fetch. After the write, get-jira-release runs again. The fetched release date, production scheduled day, and Release Notes section must match the edit, and unchanged content must still be there.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/skills/README.md`.

## 26. Get release includes related work, stage, and status

Lewis Magri, 2026-11-23 16:28 UTC

`get-jira-release` fetches status, start date, release date, the stage list and current stage, the tickets, Related work, and the Release Notes section. `fetch-release.sh` runs that whole read. Status is Unreleased, Released, or Archived. Stage is separate from status.

Covers: `.cursor/skills/get-jira-release/SKILL.md`, `.cursor/skills/get-jira-release/scripts/fetch-release.sh`, `.cursor/skills/get-jira-release/scripts/release.sh`, `.cursor/skills/get-jira-release/scripts/release-stages.sh`, `.cursor/skills/get-jira-release/scripts/release-related-work.sh`, `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/atlassian-skills.mdc`.

## 27. External comms lists phases

Lewis Magri, 2026-11-23 16:33 UTC

External comms is one section. It has an optional Phase 1 (RoW) line linking https://github.com/DEFRA/waste-tracking-service, and an optional Phase 2 (NWM) line linking https://github.com/DEFRA/digital-waste-tracking-api-site. The bullets under a phase say what was updated or what still needs an update. For Phase 1 those bullets are the Receipt of Waste documentation. Include a phase only when this release updates it. There is no separate Receipt of Waste documentation heading.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/waste-tracking-phases.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 28. Release note block is a template

Lewis Magri, 2026-11-23 16:37 UTC

The Release Notes example is a template. Comments mark optional parts: a service line, a config line, a test report, and a phase under External comms. Include an optional part only when this release has something to record there. Do not copy a comment, a placeholder, or an optional part that does not apply. Under a phase, write a bullet only for what the user says was updated or still needs an update. One answer can cover more than one doc.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 29. External comms bullets link the page

Lewis Magri, 2026-11-23 16:39 UTC

A bullet under Phase 1 (RoW) or Phase 2 (NWM) includes a link to the page when one exists. Leave the link off when it does not. Do not invent a page URL.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 30. Post a release in Slack

Lewis Magri, 2026-11-23 16:49 UTC

After creating or editing a release, remind the user to post it in the private Slack channel defra-dwt-releases: https://equalexperts.slack.com/archives/C0CHZR18GCF. Include the Jira release link.

Covers: `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/skills/create-jira-release/SKILL.md`, `.cursor/skills/edit-jira-release/SKILL.md`, `.cursor/skills/README.md`.

## 31. Workspace is the dwt-agent-workspace repository

Lewis Magri, 2026-11-24 16:29 UTC

This workspace was set up as the git repository `dwt-agent-workspace`. Cursor rules and skills are in `.cursor`. `changes/` and `docs/` are part of that repository. Service repositories are cloned into `repos/`.

`.gitignore` ignores `repos/` and `.tmp/`.

Git for a service repository runs inside `repos/<name>`. Git for this workspace runs at the repository root, and only when asked. A log entry still does not record a commit.

Covers: `.cursor/rules/git-branches.mdc`, `.cursor/rules/todo-done-log.mdc`, `changes/README.md`, `.gitignore`.

## 32. Atlassian credentials in .env

Lewis Magri, 2026-11-24 16:52 UTC

`docs/ai/atlassian-credentials.md` told people to export `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` from the shell profile. That file is removed. Credentials for this shared repository live in a gitignored `.env` at the workspace root, copied from `.env.example`.

`.cursor/rules/atlassian-credentials.mdc` is the setup rule. Skill scripts load that file through `.cursor/skills/lib/load-env.sh` and `load_env.py`. When `.env` exists, its values replace the environment, including a blank value. When `.env` is missing, scripts still use variables already in the environment.

Covers: `.cursor/rules/atlassian-credentials.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/skills/lib/load-env.sh`, `.cursor/skills/lib/load_env.py`, `.env.example`, `.gitignore`, `.cursor/skills/`.

## 33. GitHub CLI runs through the github-cli-via-docker skill

Lewis Magri, 2026-11-25 10:43 UTC

This machine has no `gh` on the host. `github-cli-via-docker` is a repository skill that runs the GitHub CLI in the local `dwt-gh` image. `.cursor/rules/local-machine.mdc` tells this machine to use that skill for every `gh` command. The rule stays uncommitted.

Covers: `.cursor/skills/github-cli-via-docker/SKILL.md`, `.cursor/rules/local-machine.mdc`, `.cursor/skills/README.md`.

## 34. Workspace is for developers and QAs

Lewis Magri, 2026-11-25 10:45 UTC

The pull request rule said this workspace is QA-led and that pull requests are for test packs, fixtures, and tooling. Developers and QAs use this workspace. Other roles may use it later. Pull requests cover product changes, test packs, fixtures, and tooling. The short description stays. There is still no Test plan section, checklist, or runbook in the pull request body.

Covers: `.cursor/rules/pull-request-descriptions.mdc`.

## 35. A pull request can change anything in the repository

Lewis Magri, 2026-11-25 10:47 UTC

The pull request rule listed product changes, test packs, fixtures, and tooling. A pull request can change anything in the repository. The short description stays. There is still no Test plan section, checklist, or runbook in the pull request body.

Covers: `.cursor/rules/pull-request-descriptions.mdc`.

## 36. Shareable generated files go in .tmp/generated

Lewis Magri, 2026-11-25 10:51 UTC

`docs/Phase-1-create-vs-Phase-2-undocumented-receipt.pdf` moved to `.tmp/generated/Phase-1-create-vs-Phase-2-undocumented-receipt.pdf`. `docs/` is removed. A file generated for someone to open or share goes in `.tmp/generated/`. Fetched Jira, Confluence, and GitHub output stays in its own folder under `.tmp/`.

Covers: `.cursor/rules/generated-artifacts.mdc`, `.gitignore`, `.cursor/skills/README.md`.

## 37. seed-repos clones the user's DEFRA team into repos/

Lewis Magri, 2026-11-25 10:55 UTC

`seed-repos` uses `gh` to read the DEFRA team the logged-in user belongs to, then clones that team's repositories into `repos/`. One team is the source. When the user is in more than one DEFRA team, the source is Digital Waste Tracking. A directory already in `repos/` is left as it is. The workspace repository is not cloned into `repos/`. On this machine `gh` is the `dwt-gh` image.

Covers: `.cursor/skills/seed-repos/SKILL.md`, `.cursor/skills/seed-repos/scripts/seed-repos.sh`, `.cursor/rules/git-branches.mdc`, `.cursor/skills/README.md`.

## 38. Skills stay generic

Lewis Magri, 2026-11-25 10:59 UTC

Skills are for the whole team. They call `gh` and do not describe this machine. `seed-repos` no longer tells the reader to use the `dwt-gh` image, and its script calls `gh`. `github-cli-via-docker` no longer points at the local machine rule. Machine-specific context stays in `.cursor/rules/local-machine.mdc`: this machine has no `gh` on the host, so those `gh` commands run through `github-cli-via-docker`.

Covers: `.cursor/skills/seed-repos/SKILL.md`, `.cursor/skills/seed-repos/scripts/seed-repos.sh`, `.cursor/skills/github-cli-via-docker/SKILL.md`, `.cursor/rules/local-machine.mdc`.

## 39. A template for the local machine file

Lewis Magri, 2026-11-25 11:01 UTC

`.cursor/rules/local-machine.mdc` is gitignored, so the team cannot see what it is for. `.cursor/rules/local-machine-file.mdc` explains it and holds the template to copy. The file is for a missing tool, the command that replaces it, or how Docker runs on that machine. Shared rules and skills stay the same for the whole team.

Covers: `.cursor/rules/local-machine-file.mdc`, `.cursor/rules/.gitignore`.

## 40. Rules tightened, decisions unchanged

Lewis Magri, 2026-11-25 11:04 UTC

The Cursor rules were shortened so they stay in the agent context. Repeated sentences were cut. The decisions, commands, mappings, links, and the Jira release note template are unchanged. `.cursor/rules/jira-release-description.mdc` is no longer applied on every turn. Read it before creating or editing a release. The Jira and Confluence rule says to do that.

Covers: `.cursor/rules/`.

## 41. A rule for writing rules

Lewis Magri, 2026-11-25 16:07 UTC

`.cursor/rules/writing-rules.mdc` records how a rule is added or edited. State the decision, command, mapping, link, or template, and cut a repeated sentence. A rule that changes any turn stays `alwaysApply`. A long rule for one task does not, and a short always-on rule names when to read it. Shared rules are for the whole team and call a tool by its name. Machine-only facts stay in `local-machine.mdc`. One rule owns a detail. Tightening wording leaves the decision in place.

Covers: `.cursor/rules/writing-rules.mdc`.

## 42. Plain sentences in the rules

Lewis Magri, 2026-11-25 16:09 UTC

The rules now ask for plain sentences a person and an agent can follow. Unfinished sentences were completed. A pronoun that did not name its subject was replaced with the subject. The decisions are unchanged.

Covers: `.cursor/rules/writing-rules.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/waste-tracking-phases.mdc`, `.cursor/rules/todo-done-log.mdc`, `.cursor/rules/git-branches.mdc`, `.cursor/rules/pull-request-descriptions.mdc`, `.cursor/rules/commit-messages.mdc`, `.cursor/rules/atlassian-credentials.mdc`.

## 43. One rule owns each release-note decision

Lewis Magri, 2026-11-25 16:15 UTC

Unclear "one" and unfinished sentences in the Jira, release notes, and commit rules now name the release, the page, or the message. "Do not create a Confluence release note" and `Already updated. Published early.` stay in the release notes rule. The waste tracking phases rule points there instead of stating those decisions again. Phase 2 external comms is included when the release updates that phase or still needs an update, which is the release notes rule.

Covers: `.cursor/rules/atlassian-skills.mdc`, `.cursor/rules/jira-release-description.mdc`, `.cursor/rules/waste-tracking-phases.mdc`, `.cursor/rules/commit-messages.mdc`.

## 44. One bash loader for .env

Lewis Magri, 2026-11-25 16:25 UTC

Skill scripts source `.cursor/skills/lib/load-env.sh`. `load_env.py` is removed. Python scripts inherit the environment from the shell that sourced that file. A shell that starts Python calls `require_atlassian_env` first.

Covers: `.cursor/skills/lib/load-env.sh`, `.cursor/rules/atlassian-credentials.mdc`, `.cursor/skills/create-jira-release/scripts/write-release-notes.py`, `.cursor/skills/create-jira-release/scripts/set-release-stages.py`, `.cursor/skills/get-jira-release/scripts/release-sections.py`, `.cursor/skills/get-jira-release/scripts/release-stages.py`, `.cursor/skills/get-jira-release/scripts/release-sections.sh`, `.cursor/skills/get-jira-release/scripts/release-stages.sh`.

## 45. load-env.sh sources .env

Lewis Magri, 2026-11-25 16:32 UTC

`.cursor/skills/lib/load-env.sh` sources the workspace `.env`. The directory walk and the line parser are gone. When `.env` exists, its values still replace the environment, including a blank value. When `.env` is missing, the script still uses variables already in the environment, then stops if the Atlassian variables are empty.

Covers: `.cursor/skills/lib/load-env.sh`.

## 46. Skill scripts are vanilla JavaScript

Lewis Magri, 2026-11-25 17:01 UTC

Skill scripts are vanilla ESM JavaScript with JSDoc. Node is 22.23.4, the version `waste-movement-backend` uses. `.cursor/skills/package.json` sets `"type": "module"` and lists no dependencies. Scripts use Node built-ins and run with `node`. `.env` is loaded by `.cursor/skills/lib/env.js`. The shell and Python scripts are removed. The retired Confluence release-note scripts are removed with them. On this machine there is no host `node` or `npm`, and this workspace has no Dockerfile, so those commands use the `node:22.23.4` image. The `dwtnpm` alias is not used here.

Covers: `.cursor/rules/skill-scripts.mdc`, `.cursor/rules/atlassian-credentials.mdc`, `.cursor/rules/atlassian-skills.mdc`, `.cursor/rules/local-machine.mdc`, `.cursor/skills/`.

## 47. This machine does not run npm for skills

Lewis Magri, 2026-11-25 17:04 UTC

`.cursor/rules/local-machine.mdc` no longer tells this machine to run `npm` in the Node image. Skill scripts have no dependencies. The `node:22.23.4` image is only the way to run `node`.

Covers: `.cursor/rules/local-machine.mdc`.

## 48. github-cli-via-docker stays bash

Lewis Magri, 2026-11-25 17:06 UTC

`github-cli-via-docker` is bash. It builds and runs the `dwt-gh` image. `build-image.js` is removed. Run `.cursor/skills/github-cli-via-docker/scripts/build-image.sh` with `bash`. The other skill scripts stay vanilla JavaScript.

Covers: `.cursor/skills/github-cli-via-docker/`, `.cursor/rules/skill-scripts.mdc`, `.cursor/skills/README.md`.

## 49. dwt-gh is a Dockerfile and Compose file

Lewis Magri, 2026-11-25 17:08 UTC

`github-cli-via-docker` no longer has a build script. `Dockerfile` installs GitHub CLI `2.105.0`. `compose.yaml` builds the `dwt-gh` image. Run `docker compose -f .cursor/skills/github-cli-via-docker/compose.yaml build`. `gh` commands stay `docker run` so the shell expands `$HOME` for the config mount.

Covers: `.cursor/skills/github-cli-via-docker/`, `.cursor/rules/skill-scripts.mdc`, `.cursor/skills/README.md`.

## 50. dwt-gh has no Compose file

Lewis Magri, 2026-11-25 17:11 UTC

`github-cli-via-docker` is a Dockerfile only. `compose.yaml` is removed. Build with `docker build -t dwt-gh .cursor/skills/github-cli-via-docker`. `gh` commands stay `docker run`.

Covers: `.cursor/skills/github-cli-via-docker/`, `.cursor/rules/skill-scripts.mdc`.

## 51. Skills may use JavaScript, Bash, or Docker

Lewis Magri, 2026-11-25 17:19 UTC

`.cursor/rules/skill-scripts.mdc` names three approved tools. JavaScript is for complex work and API requests. Bash is for a simple command sequence. A Dockerfile or Compose file runs a program a person may want to leave uninstalled. When that program uses workspace files, mount `$PWD` and set the working directory to `$PWD`.

Covers: `.cursor/rules/skill-scripts.mdc`.

## 52. A missing gh command runs through Docker

Lewis Magri, 2026-11-25 18:23 UTC

A skill calls `gh` by that name. When the command is installed, use it. When it is missing, run `gh` through the github-cli-via-docker skill. On this machine the node image has no `gh` or `docker` command, so the node container mounts the Docker socket and `HOST_HOME` and starts the `dwt-gh` image.

Covers: `.cursor/rules/skill-scripts.mdc`, `.cursor/rules/local-machine.mdc`, `.cursor/skills/lib/gh.js`, `.cursor/skills/seed-repos/`.

## 53. seed-repos is a shell script

Lewis Magri, 2026-11-25 18:35 UTC

`seed-repos` is bash. It calls `gh` for the team repositories, then `git clone` for each repository that is not already under `repos/`. The JavaScript script and `.cursor/skills/lib/gh.js` are removed. On this machine `node` no longer mounts the Docker socket. A missing `gh` still runs through the `dwt-gh` image.

Covers: `.cursor/skills/seed-repos/`, `.cursor/rules/local-machine.mdc`.

## 54. seed-repos clones into the workspace repos directory

Lewis Magri, 2026-11-25 18:37 UTC

`seed-repos.sh` resolves the workspace root four directories above the script. Clones go in `repos/`. A directory that is already there is still skipped.

Covers: `.cursor/skills/seed-repos/scripts/seed-repos.sh`.

## 55. seed-repos finds repos next to .env.example

Lewis Magri, 2026-11-25 18:39 UTC

`seed-repos` walks up from the script until it finds `.env.example`. Clones go in the `repos/` directory next to that file. A directory that is already there is skipped.

Covers: `.cursor/skills/seed-repos/`.

## 56. No default Jira project

Lewis Magri, 2026-11-26 09:25 UTC

A release has no default project. `create-release.js` requires `--project` and no longer falls back to `JIRA_PROJECT_KEY` or `DWTA`. The project key comes from the ticket, the release, or the name the user gave. Ask when none of those is known.

Covers: `.cursor/rules/jira-project-names.mdc`, `.cursor/skills/create-jira-release/`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 57. This workspace does not name create-uat-tests-from-jira

Lewis Magri, 2026-11-26 09:25 UTC

Removed the `create-uat-tests-from-jira` link from `get-jira-ticket` and the skill index. Planning or writing API tests from a ticket stays in `digital-waste-tracking-uat`. This workspace does not name that skill.

Covers: `.cursor/skills/README.md`, `.cursor/skills/get-jira-ticket/SKILL.md`.

## 58. seed-repos uses the workspace root

Lewis Magri, 2026-11-26 09:27 UTC

`seed-repos` does not search for `.env.example`. The script is `.cursor/skills/seed-repos/scripts/seed-repos.sh`. The workspace root is four directories above that file. Clones go in `repos/` there. A directory that is already there is skipped.

Covers: `.cursor/skills/seed-repos/`.

## 59. Create and edit are separate release skills

Lewis Magri, 2026-11-26 09:32 UTC

`create-jira-release` only creates a fix version. It rejects `--version` and no longer sends a PUT. A duplicate name stops and names `edit-jira-release`. `edit-jira-release` is the only skill that changes a release that already exists. It does not create one.

Covers: `.cursor/skills/create-jira-release/`, `.cursor/skills/edit-jira-release/SKILL.md`.

## 60. DEFRA team repositories are fetched, then cloned

Lewis Magri, 2026-11-26 09:40 UTC

`get-defra-team-repos` calls `gh` and saves the logged-in user's DEFRA team repositories to `.tmp/defra-team-repos/`. `seed-repos` reads that list and clones a repository that is not already under `repos/`. The seed script does not call `gh` or Docker.

`github-cli-via-docker/bin/gh` is the `gh` command when the host has no `gh`. Put that `bin` directory on `PATH`. A shell alias is not visible inside a script.

Covers: `.cursor/skills/get-defra-team-repos/`, `.cursor/skills/seed-repos/`, `.cursor/skills/github-cli-via-docker/`, `.cursor/rules/skill-scripts.mdc`, `.cursor/rules/local-machine.mdc`, `.cursor/rules/git-branches.mdc`.

## 61. .env.example lists every variable a skill reads

Lewis Magri, 2026-11-26 09:52 UTC

`.env.example` lists every variable a skill reads, including the ones with a default. A commented line leaves that default in the script.

`create-release.js`, `edit-release.js`, and `link-related-work.js` now load `.env` before reading `JIRA_RELEASE_DESCRIPTION_FORMAT` and `JIRA_RELATED_WORK_CATEGORY`. Those two were read before the file was loaded, so a value in `.env` did not reach the script.

`ATLASSIAN_USER`, `ATLASSIAN_TOKEN`, and `GITHUB_TOKEN` are sent only as an Authorization header. Scripts do not print them and do not write them to `.tmp`.

Covers: `.env.example`, `.cursor/rules/atlassian-credentials.mdc`, `.cursor/skills/create-jira-release/scripts/create-release.js`, `.cursor/skills/create-jira-release/scripts/link-related-work.js`, `.cursor/skills/edit-jira-release/scripts/edit-release.js`.

## 62. No GitHub token in .env

Lewis Magri, 2026-11-26 10:05 UTC

`GITHUB_TOKEN` is removed from `.env.example` and from the credentials rule. A token in `.env` cannot read the DEFRA organisation the way this workspace uses GitHub. `get-pr-service-version` calls `gh`, which uses the logged-in DEFRA session. The JavaScript scripts are replaced by `pr-version.sh` and `pr-versions-from-file.sh`.

Covers: `.env.example`, `.cursor/rules/atlassian-credentials.mdc`, `.cursor/skills/get-pr-service-version/`.

## 63. Shared rules are generated by rulesync

Lewis Magri, 2026-11-26 11:20 UTC

Shared rules are authored in `.rulesync/rules/`. `rulesync generate` writes Cursor rules to `.cursor/rules/` and Claude Code rules to `.claude/rules/`. The rulesync rule is `root: true`, so that rule is written to `CLAUDE.md`.

`rulesync` runs from the `dwt-rulesync` image (rulesync 43.15.0) with the workspace mounted. `.githooks/pre-commit` runs generate and stages the generated files. Install that hook with `.cursor/skills/rulesync/scripts/install-hook.sh`.

The source was imported from Cursor (`rulesync import --targets cursor --features rules`). Generate targets are `cursor` and `claudecode`. The feature is `rules`. `delete: true` removes a generated file when its source rule is gone. `.cursor/rules/local-machine.mdc` stays gitignored and is not in the source.

Covers: `.rulesync/rules/`, `rulesync.jsonc`, `.cursor/skills/rulesync/`, `.githooks/pre-commit`, `.cursor/rules/rulesync.mdc`, `.cursor/rules/writing-rules.mdc`, `.cursor/rules/skill-scripts.mdc`, `CLAUDE.md`, `.claude/rules/`.

## 64. Skills are generated by rulesync

Lewis Magri, 2026-11-26 11:24 UTC

Skills are authored in `.rulesync/skills/`. `rulesync generate` writes them to `.cursor/skills/` and `.claude/skills/`. The features in `rulesync.jsonc` are `rules` and `skills`. The source was imported from Cursor (`rulesync import --targets cursor --features skills`).

`.cursor/skills/lib/`, `.cursor/skills/package.json`, and `.cursor/skills/README.md` are not generated. Scripts import `lib` from `.cursor/skills/lib/` and are run from `.cursor/skills/`. The commit hook also stages `.cursor/skills/`.

Covers: `rulesync.jsonc`, `.rulesync/skills/`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/skill-scripts.md`, `.githooks/pre-commit`, `.cursor/skills/`, `.claude/skills/`.

## 65. Generated Cursor and Claude files are gitignored

Lewis Magri, 2026-11-26 11:30 UTC

Generated Cursor and Claude Code files are deleted from the tree and listed in `.gitignore`. That covers `.cursor/rules/`, the generated skill directories under `.cursor/skills/`, `CLAUDE.md`, `.claude/rules/`, and `.claude/skills/`. `.cursor/skills/lib/`, `.cursor/skills/package.json`, and `.cursor/skills/README.md` stay tracked.

The commit hook still runs `rulesync generate`. It does not stage the generated files. The `rulesync` and `gh` commands are the copies under `.rulesync/skills/`.

Covers: `.gitignore`, `.githooks/pre-commit`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/skill-scripts.md`, `.rulesync/rules/local-machine-file.md`, `.cursor/rules/`, `.cursor/skills/`, `.claude/`, `CLAUDE.md`.

## 66. The shared skill library is generated for Cursor and Claude Code

Lewis Magri, 2026-11-26 11:34 UTC

`lib` is a skill in `.rulesync/skills/lib/`. Generate writes it to `.cursor/skills/lib/` and `.claude/skills/lib/`. Scripts import those modules with `../../lib/<file>.js` from either tree.

The workspace `package.json` sets `"type": "module"`. `.cursor/skills/package.json`, `.cursor/skills/README.md`, and the hand-kept `lib` are no longer tracked. The skill map is `.rulesync/skills/README.md`.

Covers: `.rulesync/skills/lib/`, `package.json`, `.gitignore`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/skill-scripts.md`, `.rulesync/skills/README.md`.

## 67. package.json belongs to the JavaScript skills

Lewis Magri, 2026-11-26 11:40 UTC

The workspace `package.json` is removed. Each JavaScript skill has its own `package.json` that sets `"type": "module"`. `lib` has one too, because those modules use `import`. Generate copies that file with the skill into `.cursor/skills/` and `.claude/skills/`.

Covers: `.rulesync/skills/lib/package.json`, `.rulesync/skills/get-jira-ticket/package.json`, `.rulesync/skills/get-jira-release/package.json`, `.rulesync/skills/get-confluence-page/package.json`, `.rulesync/skills/create-jira-release/package.json`, `.rulesync/skills/edit-jira-release/package.json`, `.rulesync/skills/create-confluence-page/package.json`, `.rulesync/rules/skill-scripts.md`, `.rulesync/rules/rulesync.md`.

## 68. JavaScript skills link package.json to lib

Lewis Magri, 2026-11-26 11:42 UTC

The JavaScript skills no longer keep their own `package.json` text. Each one links `package.json` to `../lib/package.json`. That file sets `"type": "module"`. Generate copies the file into each skill for Cursor and Claude Code, because Node reads the `package.json` in the skill directory.

Covers: `.rulesync/skills/lib/package.json`, `.rulesync/skills/*/package.json`, `.rulesync/rules/skill-scripts.md`, `.rulesync/rules/rulesync.md`.

## 69. Commits do not generate Cursor or Claude files

Lewis Magri, 2026-11-26 11:51 UTC

`.githooks/` is gone. `.gitignore` ignores `.cursor/`, `.claude/`, `CLAUDE.md`, and `AGENTS.md`. A commit does not run `rulesync generate`. Run that command when the Cursor or Claude Code copies are needed.

The installed `.git/hooks/pre-commit` and `.rulesync/skills/rulesync/scripts/install-hook.sh` are removed.

Covers: `.gitignore`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/local-machine-file.md`, `.rulesync/skills/rulesync/SKILL.md`.

## 70. The rulesync image is built from .rulesync

Lewis Magri, 2026-11-26 11:53 UTC

The `dwt-rulesync` image is built from `.rulesync/Dockerfile`. The old file was `.rulesync/skills/rulesync/Dockerfile`. From the workspace root, run `docker build -t dwt-rulesync .rulesync`. `.rulesync/.dockerignore` keeps the build context to that Dockerfile. The wrapper stays at `.rulesync/skills/rulesync/bin/rulesync`.

Covers: `.rulesync/Dockerfile`, `.rulesync/.dockerignore`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/skill-scripts.md`, `.rulesync/skills/rulesync/SKILL.md`, `.rulesync/skills/rulesync/bin/rulesync`.

## 71. bin/rulesync/rulesync generates one tool

Lewis Magri, 2026-11-26 11:59 UTC

`bin/rulesync/rulesync` builds `dwt-rulesync` from `bin/rulesync/Dockerfile` and runs generate with the repository root mounted. The argument is `cursor` or `claude`. `claude` selects the `claudecode` target. The wrapper at `.rulesync/skills/rulesync/bin/rulesync` is removed.

Covers: `bin/rulesync/rulesync`, `bin/rulesync/Dockerfile`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/skill-scripts.md`, `.rulesync/skills/rulesync/SKILL.md`.

## 72. Rulesync hooks follow RULESYNC_TOOL

Lewis Magri, 2026-11-26 12:19 UTC

`RULESYNC_TOOL` in `.env` is `cursor` or `claude`. `bin/rulesync/install-hooks` installs the git hooks. After a checkout, merge, pull, or rebase, the hook loads `.rulesync` from that commit into that person's tool files. A commit writes edits from those tool files back into `.rulesync` and stages them. When `.rulesync` and the tool files both changed since the last sync, the commit stops.

Covers: `.env.example`, `bin/rulesync/install-hooks`, `bin/rulesync/sync-worktree`, `bin/rulesync/import-ai-edits`, `bin/rulesync/hooks/`, `.rulesync/rules/rulesync.md`, `.rulesync/rules/skill-scripts.md`, `.rulesync/skills/rulesync/SKILL.md`.

## 73. Git runs the hooks in bin/rulesync/hooks

Lewis Magri, 2026-11-26 12:32 UTC

The hooks live in `bin/rulesync/hooks/`. `.git/hooks` is not in the repository. `bin/rulesync/install-hooks` sets `core.hooksPath` to `bin/rulesync/hooks` and loads the tool files. The copies under `.git/hooks` are removed.

Covers: `bin/rulesync/hooks/`, `bin/rulesync/install-hooks`, `.rulesync/rules/rulesync.md`, `.rulesync/skills/rulesync/SKILL.md`.

## 74. Agents leave .rulesync alone

Lewis Magri, 2026-11-26 13:16 UTC

An agent does not read or write `.rulesync` unless it is actively debugging or upgrading rulesync with the user. It edits the generated Cursor or Claude file. A commit still writes that edit back into `.rulesync`.

`.cursor/rules/writing-rules.mdc` no longer tells an agent to edit `.rulesync/rules/`. It points at the rulesync rule.

Covers: `.cursor/rules/rulesync.mdc`, `.cursor/rules/writing-rules.mdc`.
