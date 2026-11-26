# Digital Waste Tracking agent workspace

Shared rules and skills for Cursor and Claude Code. The source is `.rulesync/`. Git hooks generate the files for the tool you use, and they write your edits back into `.rulesync` when you commit.

`.rulesync/rules/` is the source for rules. `.rulesync/skills/` is the source for skills. The skill map is `.rulesync/skills/README.md`.

Cursor files are written under `.cursor/`. Claude Code files are written to `.claude/` and `CLAUDE.md`. Those paths are gitignored. Edit the source, or edit the generated files for your tool. The next commit copies generated edits into `.rulesync`.

## New clone

Docker is required. Rulesync runs in the `dwt-rulesync` image from `bin/rulesync/Dockerfile`. There is no host Node install.

```bash
cp .env.example .env
```

Set these in `.env`. `.env` is gitignored.

| Variable | Value |
| --- | --- |
| `RULESYNC_TOOL` | `cursor` or `claude` |
| `ATLASSIAN_USER` | Your Atlassian account email |
| `ATLASSIAN_TOKEN` | An API token from https://id.atlassian.com/manage-profile/security/api-tokens |

Use "Create API token", not a scoped token, so it covers Jira and Confluence. `.env.example` lists the optional variables.

From the repository root, install the hooks and load your tool's files:

```bash
bin/rulesync/install-hooks
```

That points this clone at `bin/rulesync/hooks/` and generates `.cursor/` or `.claude/` from the current commit. A new clone has the hook files and does not run them until this command. The setting is local to the clone.

## Day to day

A commit deletes `.rulesync`, imports the Cursor or Claude files named by `RULESYNC_TOOL`, and stages `.rulesync`.

After a checkout, merge, pull, or rebase, the hook runs `rulesync generate --delete`, which replaces those tool files from `.rulesync`.

Generate one tool yourself with:

```bash
bin/rulesync/rulesync cursor
bin/rulesync/rulesync claude
```

`claude` selects the `claudecode` target. The features are rules and skills.

## Local folders

`.tmp/` is local output from the skills. `repos/` is where team repositories are cloned. Neither is committed.
