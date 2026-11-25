---
name: seed-repos
description: >-
  Clones the Digital Waste Tracking team's repositories into repos/. Uses gh
  to find the DEFRA team the logged-in user belongs to, and leaves a
  repository that is already there. Use when the user asks to seed, clone, or
  fill the repos folder.
---

# Seed repos

Clone the repositories for the DEFRA team the logged-in user belongs to into `repos/`. `repos/` is gitignored.

A directory that already exists under `repos/` stays as it is. Do not pull, fetch, reset, or delete it.

## Steps

1. From the workspace root:

```bash
bash .cursor/skills/seed-repos/scripts/seed-repos.sh
```

The script asks `gh` for the logged-in user's DEFRA teams.

- One team: that team is the source.
- More than one team: the team named Digital Waste Tracking is the source.
- More than one team and none is Digital Waste Tracking: the script stops and prints the teams.

It clones each repository with the SSH URL from `gh` into `repos/<name>`. The workspace repository is skipped. `git clone` needs the user's GitHub SSH key.

2. Report the cloned names and the names left in place.
