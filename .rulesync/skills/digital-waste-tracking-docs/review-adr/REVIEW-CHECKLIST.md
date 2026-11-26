# Assurance ADR Review Checklist

Use this checklist to review an Assurance ADR before it goes to anyone outside the team: GIO, other service teams, finance or the Solution Design Authority. It records the issues earlier reviews kept finding, so that they are caught here rather than by the reader.

The Assurance ADRs are in `technology/quality-assurance-view/decision-records/assurance-adrs/`. In Claude Code, `/review-adr <number>` works through this checklist for one ADR.

## 1. Repetition

Reviewers have told us before that our ADRs are repetitive. Each fact should have one home section, and other sections should link to it.

- [ ] Look for facts that are stated more than once. The usual ones are:
  - the problem, such as current utilisation and who shares what
  - the baseline cost and how it is worked out
  - the recommendation and the reasons for it
  - design rules
  - "why not" arguments against the other options
- [ ] Keep each fact in its home section, and replace the other copies with a link or a short reference.
- [ ] The Executive Summary has about five bullets: the problem, the recommendation, any phases, the cost and the approvals. It links to the detail and does not argue the case.
- [ ] The Options slide lists the options and does not repeat what the individual option slides say.
- [ ] Paired slides, such as target states for each phase, only describe what changes between them.
- [ ] No diagram is the same as, or part of, another diagram in the ADR.

## 2. Accuracy and Consistency

- [ ] Every status claim is true on the day the ADR is sent: approvals held, decisions made, dates. Do not write "has all its approvals" while a Design Authority approval is still pending.
- [ ] Every figure matches wherever it appears: the Executive Summary, the cost tables, the finance approval and any charts.
- [ ] Two figures for the same thing do not look as if they conflict. If a total and an increment both appear, keep one or label both clearly.
- [ ] Sizes, SKUs and schedules match between the options, the cost estimates and the target states.
- [ ] Every internal `#anchor` link points to a heading that exists. Renaming a heading changes its anchor.

## 3. Risks

- [ ] Each mitigation is consistent with its impact. If the mitigation says something cannot happen, it should not be listed as an impact.
- [ ] The mitigation deals with every impact listed, not just the first one.
- [ ] Where there is a preferred route and a fallback, the mitigation says both, for example "the aim is to move together; if they are not ready, DWT moves on its own".
- [ ] Actions are specific about who does what and when, for example "as early as possible" rather than "in due course".

## 4. Other Teams

- [ ] Another team named in the ADR, such as LAPS or GIO, would find the description of their position fair and accurate.
- [ ] DWT's own delivery does not depend on another team's approvals unless the ADR says so and explains why.
- [ ] Anything that is the other team's responsibility is in Out of Scope, and Risks links to it rather than repeating it.

## 5. Cross-Checks

- [ ] The ADR is consistent with the related ADRs and their caveats, in the `caveats/` folder next to the ADRs.
- [ ] Platform facts are checked against the CDP documentation and the CCoE Architecture Foundation wiki.
- [ ] Requests go through the current routes. For example, Fabric capacity changes go direct to the GIO Data Platform team, not through the CCoE capacity onboarding process.
- [ ] The NFR IDs quoted match the project NFR list.

## 6. Version and Revision History

- [ ] Only bump the version and add a revision history entry once the current version has been sent to someone. Changes before that are part of the current version, and its revision note does not need updating.
- [ ] The version and date on the title page, in the footer and in the revision history all match.
- [ ] The Assurance ADRs README row has the right status and a summary that matches the recommendation.

## 7. Outputs

- [ ] Build the PDF with `npm run build:assurance-adr -- <n>`. It is written to `output/ADR_0000<n>.pdf`.
- [ ] Check that the PDF shows the expected version and date.
- [ ] Open the PDF and check every slide for text that overflows the page, especially tables and split slides that have had text added.
- [ ] Publish to Confluence with `node scripts/publish-confluence.js <path to the ADR>`.
- [ ] Check that the page restriction step succeeded. If it fails, check who can edit the page in Confluence before publishing again.
- [ ] Commit the changes, so the PDF and the Confluence page match the repository.
