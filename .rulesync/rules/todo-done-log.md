---
root: false
targets:
  - '*'
description: >-
  Open work, finished work, and a local revision log. Append the log when a
  decision moves.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Open work, finished work, and a local revision log. Append the log when a
    decision moves.
  globs: []
---
# Todo, done, and the revision log

`changes/todo/` is open work. `changes/done/` is finished work. `changes/ai-revision-log.md` records why a local decision changed. Read these before changing how this workspace, or a repository in it, is meant to work.

The log records local changes in this workspace. It does not record a commit, and it does not record changes other people make in the repositories. Do not run git to write a log entry.

A repository that keeps its own `changes/` records work there. This folder is for work that spans repositories, and for repositories that do not keep their own.

A new task is a note in `changes/todo/`. It says what is wrong and what done looks like, and ends with `## Done when`. A note that waits on another links to that note. When the task is finished, move the note to `changes/done/`. A finished spec stays as written.

When a local change changes a decision in a Cursor rule, or changes how a repository in this workspace runs:

- Append the next numbered section to `changes/ai-revision-log.md`, in the order it happened. Leave older sections as they were. Name the local user and the UTC time from `date -u`. Say what changed, clearly enough to undo, and which rule or note it covers. For example: `Lewis Magri, 2026-11-11 13:29 UTC`.
- Update the Cursor rule that stated the old decision.

Record the decision in the rule, not in a code comment.
