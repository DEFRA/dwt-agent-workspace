---
root: false
targets:
  - '*'
description: >-
  dwt-agent-workspace is the git repository for this workspace. Do not run git
  commands unless the user asks.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    dwt-agent-workspace is the git repository for this workspace. Do not run git
    commands unless the user asks.
  globs: []
---
# Git

This workspace root is the git repository `dwt-agent-workspace`. Service repositories live in `repos/`, which is gitignored. `get-defra-team-repos` saves the logged-in user's DEFRA team repositories. `seed-repos` clones that list into `repos/` and leaves a repository that is already there.

The writing rules rule says the workspace rules do not apply to a directory under `repos/`. A command for one of those repositories runs inside `repos/<name>`. Follow that repository.

Do not run git in this workspace unless the user asks in the current request. That includes status, fetch, checkout, branch, commit, rebase, and push. The sections below are for this workspace.

When they ask, run it at the `dwt-agent-workspace` root.

## Push

Push only when the user explicitly says to push in the current request. Creating a branch, making a commit, or preparing work is not permission to push. That includes `git push`, `git push -u`, and a force-push after a rebase.

## Dirty tree

Before any checkout, including `git checkout main`, `git checkout -b`, or switching to another branch, run `git status`. If there are uncommitted changes, stop and ask what to do with them. Do not stash, commit, discard, or carry them onto another branch.

## New branch

Start from the updated default branch (`main`, unless the repo uses another). Name it with the branch names rule.

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b DWTC-364_short-description
```

## Update a branch

Rebase onto the updated main. Do not merge main into the feature branch.

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout my-feature
git rebase main
```

If that rebase needs a force-push, stop and ask. Do not push it.
