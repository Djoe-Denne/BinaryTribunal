---
title: GF Hypothesis Authoring
category: skills
tags: [ff8, gforce, testing, skill]
aliases: [create GF YAML hypothesis, GF injection hypothesis prompt]
sources: [ai-prompt/gf_hypothesis_from_documentation.md, ai-prompt/ai_investigation.md, ff8re/README.md, ff8re/tests/tier3_inject/GF_IFRIT_001.yaml, ff8re/tests/tier3_inject/GF_SHIVA_001.yaml]
summary: Procedure for turning GF domain documentation into Tier 3 `ff8re` injection hypotheses with robust evidence capture.
provenance:
  extracted: 0.82
  inferred: 0.14
  ambiguous: 0.04
created: 2026-06-02T16:50:00+02:00
updated: 2026-06-02T16:50:00+02:00
---

# GF Hypothesis Authoring

This workflow transforms GF domain documentation into executable Tier 3 YAML hypotheses for [[projects/re-ff8/concepts/ff8re-hypothesis-runner]].

## Inputs

- A GF domain document with entry, init, tick, counter, completion, family, and confidence.
- GF batch inventory data for cross-checking addresses and confidence.
- The GF kernel ID, written as `command_arg` at pending entry offset `+4`.
- Shared infrastructure addresses for battle tick sync, pending transfer, GF cinematic dispatch, damage resolution, and damage application.
- Live enemy slot identification so assertions watch slots that actually exist.

## Command Injection Rules

- Use pending bytes `08 80 00 03 XX 00 00 01`, where `XX` is the GF `command_arg`.
- `command_id = 0x03` means GF.
- `target_mask = 0x8008` is the shared GF target mask observed in confirmed tests.
- `command_arg` is a kernel GF ID, not a zero-based GF index.
- If a derived `command_arg` fails, capture real bytes at `BattlePendingAction_Write` (`0x484D20`) during a manual summon.

## Evidence Stages

- Stage 1 proves injection consumption with ATB sync and pending transfer.
- Stage 2 proves cinematic routing through GF cinematic dispatch and callback/context observations.
- Stage 3 proves sequence progress through GF-specific tick/counter/completion probes.
- Stage 4 proves domain effect through `BattleAction_ResolveAndApplyDamage`, `Battle_ApplyDamageOrHeal`, action globals, and HP/status snapshots.

## Breakpoint Rules

- Delete per-frame breakpoints after use; ATB tick and pending transfer breakpoints can trap every frame.
- For FamilyA/BDLink GFs, do not rely on tick-function entry breakpoints. Assert on the counter increment inside the tick instead.
- Do not assert GF identity from `GF_CALLBACK_PTR` alone, because it is persistent and can retain the previous GF callback.
- Read state after the relevant function executes, not at function entry, when the claim depends on post-execution mutation.

## YAML Construction

Author the file under `ff8re/tests/tier3_inject/GF_<NAME>_001.yaml`, then define metadata, constants, setup, act, observe, assert, cleanup, and a verdict prompt. The source prompt recommends documenting whether `command_arg` is confirmed or hypothesized and recording raw pending bytes in the header.

## Related

- [[projects/re-ff8/references/gf-runtime-test-matrix]]
- [[projects/re-ff8/skills/evidence-to-domain-doc]]
- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
