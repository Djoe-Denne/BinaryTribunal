---
title: G-Force Catalog And Families
category: concepts
tags: [ff8, gforce, reverse-engineering, concept]
aliases: [GF catalog, GF structural families]
sources:
  - docs/tech/gforce/gf_catalog.md
  - docs/tech/gforce/gf_families.md
  - docs/tech/gforce/gf_cerberus_deep.md
  - docs/tech/gforce/CHRONICLE_GF_IFRIT.md
  - ff8re/tests/tier3_inject/GF_IFRIT_001.yaml
  - ff8re/tests/tier3_inject/GF_CERBERUS_001.yaml
  - ff8re/tests/tier3_inject/GF_TONBERRY_003.yaml
  - ff8re/tests/suites/GF_OFFENSIVE.suite.yaml
  - tools/gf_batch_discovery.py
  - ai-prompt/ai_investigation.md
  - ai-prompt/completed/ai_investigation_live_gf_payload_dump.md
  - obsidian-docs/_staging/investigations/gf_chain_completion_and_support_assertions.md
  - obsidian-docs/_staging/investigations/2026-06-09_prompt20_bulk_kernel_gf_id_confirmation.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/investigation/battle-static-discovery/corpus-audit.md
  - evidence/2026-06-15T16-24-56_GF_CERBERUS_001.json
  - evidence/2026-06-15T16-26-28_GF_ALEXANDER_001.json
summary: Known GF summon entries are cataloged by command arg, effect ID, structural family, chain completeness, plus a runtime-confirmed payload dump for Alexander, Cerberus, and Doomtrain.
provenance:
  extracted: 0.88
  inferred: 0.08
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-09-12T13:50:00+02:00
---

# G-Force Catalog And Families

The GF catalog still consolidates summon chains by command arg, effect ID, and structural family, but the staging batch reduced the set of "still partial" entries and clarified where the remaining uncertainty is now mostly about runtime payload capture rather than missing chain shape.

## Junctionable GF Highlights

- Ifrit remains `cmd_arg 0x42`, effect ID `201`, FamilyB, and strong runtime-confirmed evidence.
- Diablos remains `cmd_arg 0x45`, effect ID `325` (`GF_325Diablos_InitSummonContext` `0x654210`).
- Pandemona remains `cmd_arg 0x48`, effect ID `291` (`GF_291Pandemona_*`, init `0x6ED260`).
- Cerberus remains `cmd_arg 0x49`, effect ID `203`, and a strong support-GF exemplar. `GF_203Cerberus_AllocFrameMemory` (`0xB0C2F0`) calls `BattleScratch_Unwind` (`0x5082D0`), the **unwind** of the scratch bump — not an allocator. The matching bump-alloc is `bs_modulo` `0x5082B0` (misnomer, not renamed in E3a).
- Tonberry remains SharedInit.

The core junctionable mapping `0x40..0x4F` is now structurally stable, even though the current static session still could not regenerate a fresh raw 16-row payload dump directly from the kernel table bytes.

## Structural Families (wave3: five Logic buckets over 343 entries)

- **Wrapper → init (111)**: 14-byte `mov/push/call rel32/add/ret`, disp `+0x26` (94) / `+0x06` (14) / sandwich (Quezacotl, Phoenix, slot 273). Byte-identical ≠ equivalent; `FUNC_THUNK = 0` everywhere. Diablos 325 is a standard G93 wrapper; Pandemona 291 a G14 wrapper with `ret` FL.
- **FamilyB single-task script-driven (58)**: distinct `0x5D` functions (Cerberus alone `0x62`), in bijection with the 58 `magN_b.00/.01` pairs. Not "junctionable GF": 7 GFs + Meteor, Elvoret Death, Hell's Judgement, Adel, Terra Break, slots 228–270, 331 (`MAG_331_FAMILYB`). Vague B named the remaining 116 Logic entries 225–344 (`MAG_<effect_id>_…`); convention `MAG_<effect_id>` (slot 330 = id 331, not Gilgamesh Masamune id 330). Gilgamesh 328–330 = Excalibur/Zantetsuken/Masamune. Reports: Angelo/Moogle kernel-data, `0x1852750`.
- **SharedInit (82)**: `BdLinkTask_CreateAndInitContext` with 82 unique ticks. Not GF-only: Cure, Double, items, Angelo, Choco, slot 345…
- **BdLink inline / dual-task (84)**: Fire, Shiva, Cactuar, Doomtrain, Odin, Gilgamesh 327–330 (shared workers + `mag326-329.tim` pack).
- **Irvine Shot (8)**: 40-byte entries, slots 187/191–197, BdLink in the child.

Retired: entry-level "FamilyA multi-task" (Pandemona was a wrapper; Shiva/Doomtrain/Odin are dual-task inline) and "Atypical" (Brothers/Leviathan/Alexander/Bahamut/Eden are FamilyB; Cactuar is dual-task with alt loader `0x5718E0`). Alexander tick vs Meteor tick share the FamilyB template at size `0x215` but have distinct SHAs — the old "byte-for-byte" claim is false; `dword_187281C` is Alexander-only, Meteor calls `sub_A95CD0`.

## Support And Status Validation

Support or status GFs should be validated by durable status deltas on the correct side of battle state, not by enemy HP loss:

- Cerberus -> ally `Double` and `Triple`
- Carbuncle -> ally `Reflect`. Runtime tick: `GF_277Carbuncle_SequenceTaskDriver` (`0x681630`). DispatchTick cmd_arg 70 still Generic.
- Siren -> enemy `Silence`
- Doomtrain -> enemy debuff payload, full bitmask now runtime-confirmed (see below)

That changes the interpretation of runtime coverage: many important GF proofs are now assertion-shape questions rather than missing chain-discovery questions.

## Confirmed Runtime Payload Dump (2026-06-15)

Captured live at the action-resolution boundary `BattleAction_ResolveAndApplyDamage` (`0x48FE20`), reading the resolver's action globals after the GF cinematic has dispatched. For GFs the resolver sets `COMMAND_TYPE_ID = 0xFE (254)` and `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID = cmd_arg` (kernel index is `cmd_arg - 0x40`), then loads `HIT_STATUS_1`/`HIT_STATUS_2` from `K_GF_JUNCTIONABLE`.

| GF        | cmd_arg | HIT_STATUS_1 | HIT_STATUS_2 | Observable effect |
|-----------|---------|--------------|--------------|-------------------|
| Alexander | 0x4A    | 0x0000       | 0x00000000   | Holy damage ~3600–4000, no status |
| Cerberus  | 0x49    | 0x0000       | 0x00060000   | `Double` + `Triple` on all allies |
| Doomtrain | 0x4B    | 0x003A       | 0x0100540D   | Berserk, Darkness, Doom, Petrify, Poison, Silence, Sleep, Slow, Stop, Vit 0 on enemies |

This dump was only possible after fixing the runner's named-global resolver (see [[projects/re-ff8/references/gf-runtime-test-matrix]]). The same capture confirms a pure-damage GF carries an empty status payload (Alexander), a support GF carries only a status payload with no damage (Cerberus), and Doomtrain's full multi-status mask. Each enemy slot also echoes the dispatched descriptor (`... FE 80 01 00 <cmd_arg> ...`) in its last-action record.

> Methodology: the summon is not instantaneous. A capture must wait only on GF-specific anchors (`GF_CINEMATIC_TICK 0x50B2A0`, per-GF `*_entry`/`*_tick`/`*_counter_inc`) for the first hop, never on the generic `APPLY_DAMAGE 0x494410`, otherwise an enemy turn during the invocation delay contaminates the capture.

## Runtime Test Coverage

The executable YAML matrix under `ff8re/tests/tier3_inject` still covers the junctionable `0x40..0x4F` range plus special probes such as Odin and Griever. The main refinement is how support/status assertions should be expressed:

- HP decrease for damage GFs,
- durable status additions for support or debuff GFs,
- resolve-global capture for identity when payload detail is still open.

## Discovery Tooling

`tools/gf_batch_discovery.py` still acts as the batch static feeder into runtime validation and documentation. The staging batch mostly consumed its output by tightening family classification and naming remaining runtime blockers more precisely.

## Open Questions

- The main remaining gap is fresh live payload capture for still-unread kernel or runtime state, not the overall command-arg map or chain topology.
- Doomtrain's full debuff mask is now runtime-confirmed (`HIT_STATUS_1=0x003A`, `HIT_STATUS_2=0x0100540D`); remaining unread payloads are other support GFs not yet dumped this way (Carbuncle, Siren, etc.), which the same now-working capture can cover.

## Related

- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/references/chunk-iso-function-catalog]]
- [[projects/re-ff8/references/gf-asset-loading-and-authoring]]
- [[projects/re-ff8/references/gf-runtime-test-matrix]]
- [[projects/re-ff8/references/gf-batch-discovery-tool]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
