---
name: github-cli-via-docker
description: >-
  Runs the GitHub CLI through the dwt-gh Docker image. Use when gh is run
  through Docker, or when the user asks to run gh, gh auth, or gh api via
  Docker.
---

# GitHub CLI via Docker

Run `gh` through the `dwt-gh` image, built from the official `cli/cli` release binary. GitHub does not publish a CLI image. `ghcr.io/cli/cli` is denied.

The image is `Dockerfile` in this skill. `GH_VERSION` is the GitHub CLI release it installs.

## Image

From the workspace root:

```bash
docker build -t dwt-gh .cursor/skills/github-cli-via-docker
```

## Login

Credentials are in `~/.config/gh`. Login needs the user's terminal and browser. Do not start it from the agent.

```bash
mkdir -p "$HOME/.config/gh"
docker run --rm -it \
  -v "$HOME/.config/gh:/root/.config/gh" \
  dwt-gh auth login --hostname github.com --git-protocol https --web
```

The container has no clipboard, browser, or git. The user opens https://github.com/login/device and enters the one-time code. `auth login` can exit 1 with `unable to find git executable` after the credentials are saved. Check with `auth status` before treating that as a failed login.

Do not print the token. Do not read `~/.config/gh/hosts.yml` into the chat.

## Commands

`bin/gh` is the `gh` command when the host has no `gh`. It runs the image without a terminal. Put that `bin` directory first on `PATH`, then call `gh`:

```bash
PATH="$PWD/.cursor/skills/github-cli-via-docker/bin:$PATH" gh <args>
```

A shell alias is not visible inside a script. A script calls `gh`.

Login still uses `docker run -it` above. `bin/gh` does not allocate a terminal.

Repositories a team can access. The value after the name is the team's permission. The organisation owns the repository.

```bash
PATH="$PWD/.cursor/skills/github-cli-via-docker/bin:$PATH" \
  gh api --paginate "orgs/DEFRA/teams/<team_slug>/repos" \
  --jq '.[] | [.full_name, .role_name] | @tsv'
```
