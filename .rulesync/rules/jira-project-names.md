---
root: false
targets:
  - '*'
description: Map internal team names NWM, SPI, and WOE to their Jira project and board
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Map internal team names NWM, SPI, and WOE to their Jira project and board
  globs: []
---
# Jira project names

Teams use a short internal name. Jira uses a different project key and board. Use this mapping when a release, ticket, or board is referred to by the short name. Do not look for a project key that matches the short name.

| Internal name | Jira project | Project name | Board |
| --- | --- | --- | --- |
| NWM | DWTC | DWT - National Waste Movements | DWT Collections Kanban |
| SPI | DWTSPI | DWT - Software Providers & Insights | 03 Delivery |
| WOE | DR | DWT - Waste Operator Enablement | WOE board |

NWM board: https://eaflood.atlassian.net/jira/software/c/projects/DWTC/boards/15782

SPI board: https://eaflood.atlassian.net/jira/software/c/projects/DWTSPI/boards/14179

WOE board: https://eaflood.atlassian.net/jira/software/c/projects/DR/boards/16635

Releases for these three teams are Jira fix versions on that project.

There is no default project. Use the project key from the ticket, the release, or the name the user gave. Ask when none of those is known.
