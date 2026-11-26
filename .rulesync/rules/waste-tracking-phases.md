---
root: false
targets:
  - '*'
description: >-
  Phase 1 Receipt of Waste and Phase 2 National Waste Movements run together in
  the same services
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: >-
    Phase 1 Receipt of Waste and Phase 2 National Waste Movements run together
    in the same services
  globs: []
---
# Waste tracking phases

This rule applies to a directory under `repos/`. The writing rules rule says the other workspace rules do not.

Phase 1 and Phase 2 run together in `waste-movement-external-api` and `waste-movement-backend`. Phase 2 is the direction going forward. Phase 1 stays supported, including its docs.

## Phase 1 — Receipt of Waste

`waste-tracking-service` is the docs repo. The receiver records the movement when waste arrives. The service behind it is `waste-movement-external-api` and `waste-movement-backend`.

A release note checks [Upcoming API changes](https://defra.github.io/waste-tracking-service/preview/api-upcoming-changes/) (`docs/api-upcoming-changes.md`), other pages under `docs/`, and the OpenAPI spec `docs/apiSpecifications/ReceiptAPI.yml`. The preview site is published from `main`, so a docs change can go out before release day. The release notes rule says what to write when those docs have already been published.

## Phase 2 — National Waste Movements

`digital-waste-tracking-api-docs` is the docs repo. This phase was called Collections. It covers the journey, not only receipt, and uses the same two services. Phase 2 will have its own receipts. Until then, Phase 1 receipt behaviour remains.

External comms for a release is the Phase 2 (NWM) line, linking [digital-waste-tracking-api-site](https://github.com/DEFRA/digital-waste-tracking-api-site). The release notes rule says when to include that line.

## When the phases conflict

Name the phase before editing code or docs. Use the Phase 1 docs for Receipt of Waste and the Phase 2 docs for National Waste Movements. Leave Phase 1 behaviour and docs in place unless the task is about replacing them.
