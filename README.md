# Digital Waste Tracking agent workspace

This repository is the local workspace for Cursor and Claude Code. Open it in one of those tools and ask for work across the Digital Waste Tracking estate: Jira, Confluence, GitHub, and the service repositories.

Shared rules and skills live in `.rulesync/`. Git hooks copy them into the tool you use. Those copies are gitignored. Service repositories are cloned into `repos/`, which is also gitignored. Service code stays in those clones.

Developers and QAs use this workspace. The agent follows the generated rules and runs the skills. A skill that reads Jira, Confluence, or GitHub writes the result under `.tmp/`. A skill that writes to Jira or Confluence drafts locally first and asks you before it publishes.

## What you need

- Git, and an SSH key that can clone repositories in the DEFRA GitHub organisation.
- Docker. Rulesync runs in the `dwt-rulesync` image from `bin/rulesync/Dockerfile`. Start Docker before the setup commands below.
- Node 22 on the host. Skill scripts run with `node` and use Node built-ins only, so there is no `npm install`. `waste-movement-backend` uses Node 22.23.4. A newer Node 22 is fine.
- Cursor or Claude Code.
- An Atlassian account on https://eaflood.atlassian.net, and an API token that covers Jira and Confluence.
- The GitHub CLI (`gh`), signed in to github.com so it can read the DEFRA organisation. When `gh` is not installed, the [github-cli-via-docker](.rulesync/skills/github-cli-via-docker/SKILL.md) skill runs it in Docker. Cloning service repositories still uses your SSH key.

## Set up

Clone this repository and work from its root.

```bash
cp .env.example .env
```

Set these in `.env`. `.env` is gitignored. Each person uses their own token.

| Variable | Value |
| --- | --- |
| `RULESYNC_TOOL` | `cursor` or `claude` |
| `ATLASSIAN_USER` | Your Atlassian account email |
| `ATLASSIAN_TOKEN` | An API token from https://id.atlassian.com/manage-profile/security/api-tokens |

Create the token with "Create API token", not a scoped token, so it covers Jira and Confluence. `.env.example` lists the optional variables. A commented-out line leaves the default in the script.

Install the hooks and generate the files for the tool named by `RULESYNC_TOOL`:

```bash
bin/rulesync/install-hooks
```

That points this clone at `bin/rulesync/hooks/` and writes `.cursor/` or `.claude/` from the current commit. A new clone has the hook files and does not run them until this command. The setting is local to the clone.

Open this folder in Cursor or Claude Code, matching `RULESYNC_TOOL`.

Sign in to GitHub from your own terminal:

```bash
gh auth login
```

When `gh` is not installed, build `dwt-gh` and log in as [github-cli-via-docker](.rulesync/skills/github-cli-via-docker/SKILL.md) describes. There is no GitHub token in `.env`.

Ask the agent to list your DEFRA team repositories and clone them into `repos/`. That runs [get-defra-team-repos](.rulesync/skills/get-defra-team-repos/SKILL.md), then [seed-repos](.rulesync/skills/seed-repos/SKILL.md). With one GitHub team, that team is the list. With more than one, the list is the team named Digital Waste Tracking. A repository already in `repos/` is left as it is.

## How you use it with the estate

Stay in this folder and talk to the agent. Name a ticket, a release, a Confluence page, or a repository. The skill map is [.rulesync/skills/README.md](.rulesync/skills/README.md).

Jira and Confluence are on https://eaflood.atlassian.net. GitHub is the DEFRA organisation. There is no default Jira project. Use the project key from the ticket, the release, or the team name.

| Team | Jira project | Board |
| --- | --- | --- |
| NWM (National Waste Movements) | DWTC | [DWT Collections Kanban](https://eaflood.atlassian.net/jira/software/c/projects/DWTC/boards/15782) |
| SPI (Software Providers & Insights) | DWTSPI | [03 Delivery](https://eaflood.atlassian.net/jira/software/c/projects/DWTSPI/boards/14179) |
| WOE (Waste Operator Enablement) | DR | [WOE board](https://eaflood.atlassian.net/jira/software/c/projects/DR/boards/16635) |

Releases for these three teams are Jira fix versions. The description is one sentence. The release note is the Release Notes section on that fix version.

Phase 1 is Receipt of Waste. Its docs repository is `waste-tracking-service`. Phase 2 is National Waste Movements. Its docs repository is `digital-waste-tracking-api-docs`. Both phases run in `waste-movement-external-api` and `waste-movement-backend`. Phase 2 is the direction going forward. Phase 1 stays supported. Name the phase before asking for a change to code or docs.

A merged pull request in a service repository mints a CDP service version. Ask for that version from the pull request URL, or from the GitHub links on a fetched ticket.

Planning or writing API tests from a ticket stays in `digital-waste-tracking-uat`.

### What you can ask

- Fetch a Jira ticket, including comments, attachments, linked pull requests, and related tickets. Example: `DWTC-364`.
- Fetch a Jira release: status, dates, stage, tickets, and the release note.
- Create or edit an NWM, SPI, or WOE release. You confirm before it is written to Jira.
- Fetch a Confluence page or folder, or search the wiki. Draft a page the same way: you confirm before it is published.
- Resolve the CDP service version minted by a merged pull request.
- List the DEFRA team repositories you can see, and clone any that are missing into `repos/`.

Fetched output stays in `.tmp/`. It is not committed. Read those files when you want the raw ticket, release, or page.

Service work happens inside `repos/<name>`. Git for a service runs in that directory and follows that repository. This workspace is its own git repository: rules, skills, and the notes in `changes/`. A repository that keeps its own `changes/` records its work there. `changes/` here is for work that spans repositories.

## Rules and skills

`.rulesync/rules/` is the source for rules. `.rulesync/skills/` is the source for skills. Edit them there. Cursor files under `.cursor/`, and Claude Code files under `.claude/` and `CLAUDE.md`, are generated. An edit in those copies is replaced on the next generate.

After an edit in `.rulesync`, generate the files for your tool:

```bash
bin/rulesync/rulesync --command=generate --tool=cursor --delete
bin/rulesync/rulesync --command=generate --tool=claude --delete
```

`claude` selects the `claudecode` target. Omit `--tool` to generate the tool named by `RULESYNC_TOOL`.

After a checkout, merge, pull, or rebase, the hook runs `bin/rulesync/rulesync --command=generate --delete`, which replaces those tool files from `.rulesync`.

Something that is true only on your machine, such as a missing tool, goes in `.cursor/rules/local-machine.mdc`. That file is not committed. Shared rules stay in `.rulesync/rules/`.

## Local folders

| Path | What it holds |
| --- | --- |
| `.env` | Your Atlassian token and `RULESYNC_TOOL`. |
| `.tmp/` | Fetches and drafts from the skills. |
| `.cursor/` or `.claude/` | Generated rules and skills for the tool you use. |
| `repos/` | Cloned DEFRA team repositories. |
