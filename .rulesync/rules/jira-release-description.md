---
root: false
targets:
  - '*'
description: >-
  Read when creating or editing an NWM, SPI, or WOE Jira release or its Release
  Notes. Covers the one-sentence description, the Release Notes template, dates,
  versions, config, test reports, and external comms.
globs: []
cursor:
  alwaysApply: false
  description: >-
    Read when creating or editing an NWM, SPI, or WOE Jira release or its
    Release Notes. Covers the one-sentence description, the Release Notes
    template, dates, versions, config, test reports, and external comms.
---
# Jira release notes

NWM, SPI, and WOE use the same two parts on a fix version. Do not create a Confluence release note. Do not list the work items in either part. Jira already lists them on the release.

## Description

One sentence on what the release changes. No heading. That sentence is the whole description field.

## Release Notes

The rich text section on the release page, separate from the description field. Title it **Release Notes**. Use the template below. A comment marks an optional part. Include that part only when this release has something to record. Do not copy a comment, a placeholder, or an optional part that does not apply.

Before an edit, fetch the release with get-jira-release and read the status, start date, release date, stage, tickets, related work, description, and Release Notes section. Build the edit from that copy. After writing, fetch again. The release date, the day scheduled for production, and the Release Notes section must match the edit. Content that was not changed must still be there.

The only dates in the note are the two scheduled-for lines. Write the day, such as `24 Nov 2026`. Leave the line empty when it is not scheduled. Do not add a time, `Release note created`, `Release to ext-test`, or `Release to Production`.

The Jira release date and `Release to Production scheduled for` are the same day. When either changes, set both. `Release to ext-test scheduled for` is a separate day.

The note's Description bullets are short sentences, one per change. Do not retell the tickets. Leave bullets that are already written.

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

Services and versions: the first version is what ext-test and prod are running. The second is the minted CDP version this release deploys. Link each to `https://github.com/DEFRA/<repo>/releases/tag/<version>`. A merge to `main` mints a version for that repo. Each service and each test repo has its own versions. The version in a test-results URL is the test repo's version, not a service version. A difference is expected.

Config changes: one bullet for each environment variable this release adds, changes, or removes. Write `None` when there are no config changes. A value that is safe to store in git goes in [cdp-app-config](https://github.com/DEFRA/cdp-app-config). Link `services/<service>/<environment>/<service>.env`, or `services/<service>/defaults.env` when it applies to every environment. Do not copy the value. A secret is added in CDP. Name the variable, the service, and the environments. Do not write the value. Secrets are not stored in cdp-app-config. Redeploy the service before it uses the new config.

Relevant Test Reports: one bullet per CDP test run. The label is the type, such as UAT, regression, compatibility, or perf-test. Keep the URL the user gave: `https://portal.cdp-int.defra.cloud/test-suites/test-results/<environment>/<version>/<test-suite>/<run-id>/index.html`. A run can come from any test repo. When creating a release, and when editing a release whose note has no test reports, ask for each report as a link and a type. The user can say they have not run them or do not have them yet. Write `None` only then. Do not invent a link.

External comms is one section. Include a phase only when this release updates that phase or still needs an update. A phase line names the phase and links its repo. One bullet under the phase line for each thing that was updated or still needs an update. Link the page when a page exists. Do not invent a page URL or a pull request.

Phase 1 (RoW) links [waste-tracking-service](https://github.com/DEFRA/waste-tracking-service). That line is the Receipt of Waste documentation in the waste tracking phases rule. Ask whether the upcoming API changes page, the OpenAPI spec, and the other docs need an update. Write a bullet only for what the user says was updated or still needs an update. One answer can cover more than one of those. Link a pull request when the user gives one. Write `No change` or `None` only when the user says so. When the user says the docs went out early, write `Already updated. Published early.`

Phase 2 (NWM) links [digital-waste-tracking-api-site](https://github.com/DEFRA/digital-waste-tracking-api-site). Name what was updated or what still needs an update. Write `No change` only when the user says there is nothing to update. Do not invent a change.

Ask when creating a release, and when editing a release whose note does not already answer External comms. Do not add a separate Receipt of Waste documentation heading.

After creating or editing a release, remind the user to post it in [defra-dwt-releases](https://equalexperts.slack.com/archives/C0CHZR18GCF) with the Jira release link.

Write the description with the Jira version REST API. Read and write the Release Notes section with Jira GraphQL: `jira.versionById.richTextSection`, `jira.updateJiraVersionRichTextSectionTitle`, and `jira.updateJiraVersionRichTextSectionContent`. Set the title to `Release Notes` when creating the section. Do not put the version list in the description.
