---
name: seed-repos
description: Clones the repository list from get-defra-team-repos into repos/. Leaves a repository that is already there. Use when the user asks to seed, clone, or fill the repos folder.
targets:
  - '*'
---
# Seed repos

Clone the repositories saved by [get-defra-team-repos](../get-defra-team-repos/SKILL.md) into `repos/` at the workspace root. `repos/` is gitignored. The script is `.cursor/skills/seed-repos/scripts/seed-repos.sh`. The workspace root is four directories above that file.

A directory that already exists under that `repos/` stays as it is. Do not pull, fetch, reset, or delete it.

## Steps

1. Run [get-defra-team-repos](../get-defra-team-repos/SKILL.md). Read `.tmp/defra-team-repos/team.txt` and `.tmp/defra-team-repos/repos.tsv`. If that skill fails, stop.

2. From the workspace root:

```bash
bash .cursor/skills/seed-repos/scripts/seed-repos.sh
```

The script reads `.tmp/defra-team-repos/repos.tsv`. It does not call `gh`. It clones each SSH URL into `repos/<name>`. The workspace repository is skipped. `git clone` needs the user's GitHub SSH key.

3. Report the cloned names and the names left in place.
