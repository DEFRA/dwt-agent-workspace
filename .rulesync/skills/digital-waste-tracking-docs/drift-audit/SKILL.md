---
name: drift-audit
description: >-
  Pull DEFRA repos, drift-audit the architecture hub in
  repos/digital-waste-tracking-docs, propose doc edits, then advance
  watermarks only on accept.
---

# Drift audit

Run this from `repos/digital-waste-tracking-docs`. Run it periodically, about every couple of weeks. It fetches `origin/main` for the tracked repos, reports what changed on main since the last accepted sync, and proposes doc edits for you to approve or reject. Reconciled repos are committed via `--accept` (Step 6). Anything you defer resurfaces on the next run until accepted. Manual `git pull`s or branch switches in between are harmless. The audit always evaluates `origin/main`, and the baseline only moves on accept.

## Step 1 — Run the sync script

```bash
bash "$(git rev-parse --show-toplevel)/.claude/scripts/drift-audit.sh"
```

The script:

- Fetches `origin/main` for the watched repos. The watchlist is derived from the LikeC4 model (every current `frontend`/`backend` element carrying a GitHub link, via `.claude/scripts/list-model-repos.mjs`, which needs the project's Node/LikeC4 toolchain) plus the explicit `EXTRA_REPOS` list in the script for repos that are watched but never modelled (the public-API docs site, the perf-test harness, shared CDP docs, the Defra architecture site at https://defra.github.io/architecture/). Set `$DWT_SYNC_WORKSPACE` for non-default layouts. It never modifies a working tree or switches branches, so a repo on a feature branch is still audited against `origin/main`. Repos not present locally are skipped with a note. If model derivation can't run, the script warns and watches only `EXTRA_REPOS`.
- Compares each repo's `origin/main` against its committed watermark from the last accepted sync (per-repo SHA files under a per-docs-repo namespace, `~/.cache/defra-sync/<this-repo>/`). This baseline only moves on `--accept` (Step 6), so it is independent of any manual `git pull` or branch switch. The diff always spans everything since the last reconciled sync, never just the latest fetch.
- Prints a per-repo `git log <old>..<new> --oneline` for any repo that advanced.
- Stages the new HEAD to `<repo>.sha.pending` without advancing the committed watermark. Un-reconciled drift therefore reappears on every run until you accept it.

## Step 2 — If nothing advanced, stop

If the report says no repos advanced (or only baselined for the first time), tell the user so and stop. Do not invent drift.

## Step 3 — Per-repo drift audit

For each repo that advanced, do a scoped pass:

1. Triage commit subjects. Pick the ones that look architecture-relevant:
   - auth model changes (Cognito JWT, Basic, DEFRA ID, pre-shared keys)
   - datastore additions or removals (new Mongo collection, S3 bucket, SQS queue, Redis usage)
   - new or removed service or endpoint
   - env-var additions that affect service config (`ACCESS_CRED_*`, `BACKEND_API_PRESHARED_KEY`, and similar)
   - framework or Node version bumps (the 22.13.1 / 22.16.0 split is already drift)
   - new external dependencies (third-party APIs, GOV.UK services)
   - relationship changes between services
   - for the Defra architecture site: changed or new guardrails (`GR-*` ids), principles, governance routes, or ADR guidance that a DWT ADR cites, follows, or departs from. Link to the published page, not the repo
2. Inspect the diff for each relevant commit (`git -C <repo> show <sha>` or `git -C <repo> diff <a>..<b>`) to confirm what actually changed. Do not trust the commit subject alone.
3. Cross-reference against the architecture hub:
   - `technology/current-state-views/structure-view/**` for C4 models (services, relationships, tech labels, lifecycle tags)
   - `technology/integration-architecture/**` for interface contracts
   - `technology/quality-assurance-view/decision-records/**` for Assurance ADRs and DWT ADRs that may need amending
   - `technology/data-architecture/**` for data ownership and flows
4. Report findings severity-graded (critical, major, minor, nit) with `file:line` citations.
5. Propose, then ask. Do not edit any file in the docs repo until the user confirms. Group proposed edits by file and present them as a list the user can approve or reject.

## Step 6 — Accept the watermark once reconciled

The script staged the new HEADs to `*.sha.pending` but did not advance the committed baseline. Only after a repo's drift is reconciled (edits applied, or the user confirms nothing is needed) advance it:

- All audited repos done in one pass: `bash "$(git rev-parse --show-toplevel)/.claude/scripts/drift-audit.sh" --accept`
- Some repos deferred: name only the reconciled ones, for example `bash "$(git rev-parse --show-toplevel)/.claude/scripts/drift-audit.sh" --accept waste-movement-backend waste-organisation-backend`

Any repo left unaccepted keeps its old baseline and will resurface in the next run's report. Do not accept a repo the user chose to defer.

## Constraints

- Honour the CI invariants enforced by `test/structure-view.spec.ts`. Every element kind needs description, technology, and a GitHub link (non-`#future`), no bare `->`, typed relationship kinds in both static and dynamic views, and dynamic-view steps must back to a same-direction static relationship.
- Do not run `npm run snapshot:solution-overview`, `npm run snapshot:solution-architecture-definition`, or any `npm run confluence:publish*` script as part of the audit.
- Do not pass `--include-delivery-passport` to anything.
- Pre-existing known drift: waste-movement-backend not modelled as a C4 node despite being the production persistence anchor, the Vitest/Jest test-framework split across services, and Node version drift (22.13.1 vs 22.16.0). Flag these only if a commit in this sync makes one of them worse.
