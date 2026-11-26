---
name: get-defra-team-repos
description: >-
  Get the logged-in user's DEFRA team repositories and save the name and SSH
  URL of each one under .tmp. Use when the user asks which DEFRA team
  repositories they can clone, and before seed-repos clones them.
---

# Get DEFRA team repos

Asks `gh` for the DEFRA team the logged-in user belongs to, then saves that team's repositories. It does not clone them.

## Steps

1. From the workspace root:

```bash
bash .cursor/skills/get-defra-team-repos/scripts/get-defra-team-repos.sh
```

The script calls `gh`. The skill scripts rule says how `gh` runs when that command is not installed.

- One team: that team is the source.
- More than one team: the team named Digital Waste Tracking is the source.
- More than one team and none is Digital Waste Tracking: the script stops and prints the teams.

2. Read the saved files. If the script fails, stop and report the exact error.

| File | Contents |
| --- | --- |
| `.tmp/defra-team-repos/team.txt` | Team name, then the team slug |
| `.tmp/defra-team-repos/repos.tsv` | One repository per line: name, then the SSH URL, separated by a tab |

3. Return the team and the repository names to the caller.

## Related skills

- [seed-repos](../seed-repos/SKILL.md) — clone this list into `repos/`
- [github-cli-via-docker](../github-cli-via-docker/SKILL.md) — the `gh` command when the host has no `gh`
