---
root: false
targets:
  - '*'
description: >-
  Use the Jira, Confluence, and GitHub skills in .cursor/skills. Read fetched
  files. Confirm before a write.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Use the Jira, Confluence, and GitHub skills in .cursor/skills. Read fetched
    files. Confirm before a write.
  globs: []
---
# Jira, Confluence, and GitHub

Skills in `.cursor/skills/` read and write Jira, Confluence, and minted CDP service versions. Read `.cursor/skills/README.md` and the skill named in that README before running a script. The skill scripts rule says how a script is run.

Credentials come from `.env`. The Atlassian credentials rule says how that file is set up.

Fetched output goes in the folders named by the generated artifacts rule. Read those files. Do not guess ticket, release, or page contents from memory.

A skill that writes to Jira or Confluence drafts locally first. Confirm with the user before that write.

Planning or writing API tests from a ticket stays in `digital-waste-tracking-uat`.

NWM, SPI, and WOE releases are Jira fix versions. Read `.cursor/rules/jira-release-description.mdc` before creating or editing a release. Use create-jira-release to create a release and edit-jira-release to change a release.
