---
title: Battle Action Sequencing
category: concepts
tags: [ff8, battle-system, reverse-engineering, concept]
aliases: [DispatchTick workers, action payload, presentation sequencing]
sources:
  - docs/tech/investigation/battle_loop_render_pipeline_entrypoints.md
  - docs/tech/investigation/battle-static-discovery/closure-audit.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/reference/address_catalog.md
summary: Eleven presentation workers behind DispatchTick, the 20-byte action payload, MagicList callback slots with sticky-C4 follow-ups, and the impact-time domain seam.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-09-10T14:30:00+02:00
updated: 2026-09-11T18:30:00+02:00
---

# Battle Action Sequencing

Presentation sequencing for one resolved action. Domain resolution commits first (`0x48FE20` → `0x494410`); task opcode `'h'` (`0x68`) then carries a 20-byte payload from `0x1D280C4` (stride 20) into `BattleActionSequence_DispatchTick` (`0x50A790`), which latches it via `BattleActionSequence_PreparePayloadContext` (`0x50BF90`) and **registers** (never directly calls) one of eleven `Tick_*` workers through `au_re_BdLinkTask`. `BdLinkTask_Pump` (`0x508420`) runs `node+8` and unlinks on return bit 2.

## Payload Layout (GetText-built)

| Off | Field | Role |
| --- | --- | --- |
| `+0` u8 | attacker slot | `0x1D972C0 + 0x9C*slot` |
| `+1` u8 | route byte | **sole** DispatchTick selector; a GetText snapshot, not the pending command id nor live `COMMAND_TYPE_ID` (`0x1D27AD9`) |
| `+2` u8 | anim id | `0x505C00`; forced `0x0B` on the 15/70 path |
| `+3` u8 | camera byte | explicit camera (bit `0x80`) for route `0x08` |
| `+4` u16 | cmd_arg | `0xFFFF` / 15 / 70 / Gilgamesh 7–10 |
| `+6` u16 | effect_id (1-based) | → `MagicList_Logic` via `0x50AF20` |
| `+8` u32 | event group 0 ptr | consumed as `result_event` |
| `+0xC` u32 | text/context ptr | message BdLink |
| `+0x10` u8 | group-0 count | selects Physical `0x50BD00` vs `0x50BD80` |
| `+0x11` u8 | group_count−1 | further groups stride 20 |

Event records stride `0x18`: slot, reaction, flags (`0x04` visibility, `0x40` death, `0x10/0x20/0x30` BdLink reaction), status1/`+6` popup amount/status2, paired slot at `+0xC` (`0xFF` = none).

Production (`GetText @ 0x48D200`, 1280 insns): anim switch-1 (party table / `0xEC–0xFE` remap / caller-passed) + command switch-2 (29 handlers, Attack cmd 1 → default) with rewrites (item→`0xF4`, fail→`0`); LABEL_182 `@ 0x48E34B` freezes `payload[+1]==COMMAND_TYPE_ID` plus `+0/+2/+3/+4/+6/+8/+0xC` from 12 call sites; `+0x10/+0x11` come from Resolve/PrepareTurn, never GetText; cmd 3 (GF charge) returns 1 with no snapshot; capacity 32 slots, no observed bound.

## Dispatch Routes (`payload[1]`)

| Route | Worker |
| --- | --- |
| `0x00` | `0x50BD00` / `0x50BD80` by `+0x10` (type 0 = fail/Kamikaze/Phoenix-Pinion fail — **not** domain Attack, which is pending id 1 and takes the default path) |
| `0x1C` | OR `battle_to_update_flags |= 0x10000000`, then default (consumed in `0x506690`, skips flash) |
| `0x26`/`0xF4`/`0xFE` | `Tick_GF_Cinematic` (`0x50B2A0`), except `+4 ∈ {15,70}` → Generic (MiniMog/Chocobo/GF share the cinematic tick; only `0xFE` is junctionable GF; 70 = Carbuncle cmd_arg) |
| `0xEC`/`0xF5` | `Tick_Special` (`0x50B830`) |
| `0xED`/`0xEE` | `Tick_EDEE` (`0x50BEE0`) |
| `0xF1` / `0xF7` / `0xFC` | `0x50BDC0` / `0x50B0C0` / `0x50B190` (`0xFC` direct, no predicates) |
| default | `+4==0xFFFF` → `0x50BC20`; `+6==0` → `0x50BB00`; `+2!=0` → Generic `0x50A9A0`; else `0x50B190` (covers Attack 1, Renzokuken `0xF9/0xFA/0xFB`, Angelo `0xF0`) |

## Callback Slots And Sticky C4

`Magic_GetIDLoad` has five callers: Generic, DefaultOrFC, GF, Special write slot `g_GfActiveCallbackPtr` (`0x21DFEC4`); AFFFF writes `g_BattleActionCallbackPtr_C0` (`0x21DFEC0`). GF/Special copy C4→C8 (`0x21DFEC8`) as an entry backup. F7/F1/ED/EE **call sticky C4 with no local load** — follow-up contract: an isolated replay must reload MagicList or these routes call 0. All eight worker indirect calls (`action_seq`) are `closed_static` to `MagicList_Logic[effect_id-1]` via unique writer `0x50AF20` (bound 0..399). `0x502F78` is a separate `relay71` family (`open_static_bounded`, FPs `{0x48AD10,0x487670,0x4876B0,0}`), not MagicList.

## Impact-Time Domain Seam (not purely cosmetic)

```text
0x50BD80 / GF mode-3 / ParamBZero-no-anim / script opcodes 0xAA/0xB2/0xB7 (0x504BB0)
  → 0x50A670 → 0x506BA0 → 0x506690
      → 0x493D80 impact sync: F_CHAR_DATA HP, persistent status, crisis,
          mug/blow-away, GF absorb (NOT the slot-HP commit — that is 0x494410 at resolve)
      → reactions + BattlePresentation_SpawnDamagePopup 0x5068B0 (popup never mutates HP)
```

Many `MAG_*` workers also call `0x506690` directly (second family outside the 11 ticks).

Opcodes `<0x80` of `BattleEffectScript_Interpreter` share one handler: clip=opcode via `BattleAnimation_StartActorAndWeaponClip`, `or [..+2Ch],0Ah`, yield −1 (anim clips, not impact).

`BattleEffectScript_Interpreter` (`0x504BB0`) also drives H4 UV slots via opcodes `0x80/0x9B/0x9F/0xBD/0xBE` → `BattleModel_ApplyH4UvSlot` family (UV animation, not impact).

## Related

- [[projects/re-ff8/concepts/battle-lifecycle]]
- [[projects/re-ff8/concepts/damage-status-pipeline]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/references/battle-address-catalog]]
