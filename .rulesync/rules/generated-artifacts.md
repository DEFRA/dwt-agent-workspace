---
root: false
targets:
  - '*'
description: Where .tmp files go. Fetches and drafts use these folders only.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Where .tmp files go. Fetches and drafts use these folders only.
  globs: []
---
# Generated artifacts

`.tmp/` is gitignored. A fetch or a draft uses one of these paths, from the workspace root. The script writes the fetch. Do not redirect it, and do not pass another output directory.

| Path | What it holds |
| --- | --- |
| `.tmp/jira-tickets/<KEY>/` | One Jira ticket. `<KEY>` is the ticket key. |
| `.tmp/jira-releases/<id>/` | One Jira fix version. `<id>` is the numeric version id. |
| `.tmp/jira-releases/new/` | The draft for a release that does not exist yet. |
| `.tmp/confluence-pages/<id>/` | One Confluence page and its child pages. |
| `.tmp/confluence-folders/<id>/` | One Confluence folder and the pages inside it. |
| `.tmp/confluence-searches/<slug>.txt` | One Confluence search. |
| `.tmp/confluence-drafts/<slug>/` | A Confluence page draft before it is published. |
| `.tmp/defra-team-repos/` | The DEFRA team repository list. |
| `.tmp/generated/<name>/` | A file for someone to open or share. Keep the filename and tell the user the path. |

A ticket fetched for a release stays in `.tmp/jira-tickets/<KEY>/`. Do not copy it under the release.

A saved record uses the same basename for the text file and the JSON file: `ticket.txt` and `ticket.json`, `comments.txt` and `comments.json`, `github.txt` and `github.json`, `release.txt` and `release.json`, `issues.txt` and `issues.json`, `stages.txt` and `stages.json`, `sections.txt` and `sections.json`, `related-work.txt` and `related-work.json`, `page.txt` and `page.json`, `folder.txt` and `folder.json`. Service versions for a ticket are `service-versions.txt` and `service-versions.json` in that ticket folder.
