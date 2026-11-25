# Changes

What is changing locally in this workspace, and why.

This workspace is the git repository `dwt-agent-workspace`. It orchestrates work across the service repositories in `repos/`. Do not run git commands for this folder unless asked. Git for a service repository runs inside `repos/<name>`.

- `todo/` is work that is not done.
- `done/` is work that is finished.
- `ai-revision-log.md` is why each local change happened.

The log records local changes made in this workspace. It does not record changes other people make in the repositories.

A new task starts as a note in `todo/`. When it is finished, move the note to `done/`. A local change that moves a decision, or that changes how a repository in this workspace runs, appends the next numbered section to `ai-revision-log.md` and updates the Cursor rule that stated the old decision. The section names the local user and the UTC time. It says what changed, concretely enough to unpick. It does not record a commit.

A repository that already keeps its own `changes/` records work inside that repository there. This folder is for work that spans repositories, and for repositories that do not keep their own.
