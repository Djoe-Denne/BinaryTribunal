---
title: IAM IdP Connect (ADR 0407-0410)
category: project
tags: [concept, project, testing]
aliases: [IdP Connect, IAM identity providers, idp-connect-contract]
sources: [C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-20-01a0c47f-1f29-73b2-91ce-2527f14ecc66.jsonl, C:/Users/djden/.codex/sessions/2026/09/21/rollout-2026-09-21T17-04-19-01a0c47f-1ccc-7a00-ac7e-e2c34c3d0569.jsonl]
summary: >-
  Wave-3 IAM plan: extract GitHub/GitLab OAuth from IAMRusty behind a
  vendor-neutral HMAC HTTP contract with standalone GitHub/GitLab Connect
  services.
provenance:
  extracted: 0.77
  inferred: 0.17
  ambiguous: 0.06
created: 2026-09-22T00:00:00+02:00
updated: 2026-09-22T00:00:00+02:00
---

# IAM IdP Connect (ADR 0407–0410)

Wave-3 of AIForAll ADRs (2026-09-20): extract the GitHub/GitLab OAuth2
adapters out of IAMRusty so that identity-provider integrations become
independent vendor-specific services behind a common contract. Distilled from
the 2026-09-21 sessions of [[projects/AIForAll/AIForAll]]. ^[extracted]

## The Four ADRs (Accepted, Unimplemented)

| ADR | Decision |
|---|---|
| **0407** contrat authn fédérée vendor-neutral | Contract crate `idp-connect-contract`; IAM keeps `ProviderOAuth2Client`/`OAuthService` traits; providers become external, not in-process adapters |
| **0408** connecteurs IdP services HTTP | Thin rustycog services **GitHub Connect / GitLab Connect**; no user JWTs on the Connects; no factory `GH, GL` in IAM |
| **0409** confiance callback OAuth IdP Connect | HMAC-signed callback trust between IAM and the Connects; secrets live outside IAM; CSRF/`OAuthState` stays IAM-side |
| **0410** migration connecteurs IAM | Incremental slices S1–S6 without breaking `/iam/api/auth/{provider}`; crate name `iam-service` (was miswritten `iamrusty-tests` in the draft) |

Numbering note: the 04xx band was chosen deliberately — 0009 would have
collided with the Apparatus numbering band (00xx). ^[extracted]

## State After The Sessions

- **S1 done**: `idp-connect-contract` crate exists with the HMAC module and
  review briefings PASS.
- **S2 partial**: IAM-side HTTP connector, `idp_registry`, `IdpMode`
  configuration, and WireMock fixtures under `tests/fixtures/idp_connect/`
  exist — partly from a **parallel task** that ran while P4-core was being
  implemented; it touched both idp-connect-contract and IAMRusty.
- **S3–S6 not started**: the actual GitHub Connect and GitLab Connect
  services do not exist. ^[extracted]

## Design Rationale

The common authentication interface was the stated future intent in IAM docs
and the wiki (which previously taught "add Google inside IAM" — a hole 0407+
close). Security posture: HMAC over the callback instead of shared user
tokens, secrets out of IAM, IdP-specific logic isolated per service so a new
vendor (e.g. Google) means deploying another Connect service, not patching
IAM. Priorities stated by the user: security, then maintainability, then
idiomatic Rust/rustycog conformance. This contract-first move parallels the
schema-driven designs of
[[projects/binary-tribunal/references/hypothesis-definition-schema]] and
[[projects/re-ff8/references/semantic-triple-pipeline]]. ^[extracted]

## Wiki Distillation Note

The AIForAll Obsidian vault ingested this work; a red-team audit page
(`projects/iamrusty/red-team-iam-2026-08-31.md`, F01/F02) exists but is out of
scope for the IdP slice. In this vault (re-ff8) this page is the distilled
reference — cross-project pattern parallel:
[[projects/AIForAll/concepts/adr-status-discipline]]. ^[inferred]
