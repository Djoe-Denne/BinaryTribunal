---
title: Renzokuken (Squall Limit)
category: concepts
tags: [ff8, battle-system, runtime-memory, concept]
aliases: [Squall limit break, gunblade trigger, Renzokuken, Lion Heart finisher]
parent: "[[projects/re-ff8/concepts/limit-break-architecture]]"
sources:
  - IDA static decompilation 2026-06-14 (BattleLimitRenzokuken_SetFinisherAndComputeTargetMask 0x48F270, ComputeRenzokukenDamage 0x48F350, getRenzokukenFinisherText 0x47E5F0, Config menu sub_4CE080)
  - Live debugger camera capture 2026-06-14 (cam_limit timeline) + keyboard config read
summary: Squall's Renzokuken is a compound limit — a player-triggered multi-hit gunblade sequence followed by a kernel-table finisher. The hit trigger reads the "Trigger" input button (manual unless SG_RENZOKUKEN_AUTO bit0 is set); the finisher is chosen from K_RENZOKUKEN_FINISHER and applied hit-by-hit; the camera interleaves full-takeover and overlay modes.
provenance:
  extracted: 0.82
  inferred: 0.12
  ambiguous: 0.06
created: 2026-06-14T10:25:00+02:00
updated: 2026-06-14T10:25:00+02:00
---

# Renzokuken (Squall Limit)

Sub-entity of [[projects/re-ff8/concepts/limit-break-architecture]]. Squall's Limit Break is **Renzokuken**: a player-triggered chain of gunblade slashes, followed by a **finisher** (Rough Divide / Fated Circle / Blasting Zone / Lion Heart) selected from a kernel table.

## Entry

Renzokuken launch is **ordinary** up to the first accepted pending action (see the parent page): crisis level enables the Limit overlay, and the launch goes through the normal menu-staging → `BattlePendingAction_Write` → exec-transfer → `EnemyAI_PrepareTurnAction` path. The Squall-specific behaviour starts once the sequence animation begins.

## The hit trigger

Each gunblade slash is gated by the player pressing the **"Trigger"** input within a timing window.

- **Which key:** the "Trigger" function is logical input index 5, bound in `ff8input.cfg` at keyboard slot `dword_1D2A2DC`. See [[projects/re-ff8/concepts/input-configuration]] for the full pipeline. (Live example: scancode `0x12` = **E**.)
- **Manual vs auto:** `SG_RENZOKUKEN_AUTO` (`0x1CFE978`) **bit 0** selects auto-trigger. When clear (default/manual) the player must press Trigger; when set, hits land automatically.
- **Indicator:** `SG_RENZOKUKEN_INDICATOR` (`0x1CFE979`) toggles the on-screen timing prompt. With it disabled there is no visual cue for the window.
- **Input source:** the button state is built by `Input_ProcessInput` (`0x467D10`) from the DirectInput keyboard buffer (`get_key_state`, `0x4685F0`); the Config menu that toggles the Auto/Indicator options is `sub_4CE080`.

A successful press within a window adds a slash; the number of landed hits feeds the damage of the chain (and, with a full chain, enables the finisher).

## Finisher selection and resolution

The finisher is a kernel-table entry, not hard-coded:

- `K_RENZOKUKEN_FINISHER` — kernel array, **12-byte entries** with at least `{ textIndex (word @ +0), targetInfo, hitCount }`.
- `byte_1D28E2E[0]` — the **selected finisher index** for this Renzokuken.
- `domain::BattleLimitRenzokuken_SetFinisherAndComputeTargetMask(finisher_idx, caller_mask)` (`0x48F270`) — stores `finisher_idx` into `byte_1D28E2E[0]` and computes the follow-up target mask from the entry's `targetInfo`, keeping the caller mask unless the kernel info expands to a `0x8000` group mask (same override rule as Zell's Duel).
- `ComputeRenzokukenDamage` (`0x48F350`) — sets `COMMAND_TYPE_ID = -7` (0xF9, the Renzokuken-finisher command family), loads the active attacker/target context, writes `hitCount` into the target slot, then loops `hitCount` times calling `BattleAction_ResolveAndApplyDamage` + `Battle_UpdateDamage` per hit.
- `getRenzokukenFinisherText(idx)` (`0x47E5F0`) — resolves the finisher name string from the kernel header text block (`-1` ⇒ default "not found" text).

### Finisher / sequence scripts

The visible animations are kernel magic scripts:

| Script | Address | Role |
| --- | --- | --- |
| `MAG_160_RENZOKUKEN__4_HITS` | `0x5FF080` | standard Renzokuken chain (4 hits) |
| `MAG_141_RENZOKUKEN__5_HITS` | `0x61DE70` | 5-hit chain variant |
| `MAG_159_RENZOKUKEN_VS_XATM092` | `0x600BC0` | boss-specific variant |
| `MAG_161_RENZOKUKEN_VS_ELNOYLE_ELVORET` | `0x5FD100` | boss-specific variant |
| `MAG_163_ROUGH_DIVIDE` | `0x5F5B80` | finisher |
| `MAG_165_LION_HEART` | `0x5E9470` | finisher (best weapon) |

`K_RENZOKUKEN_FINISHER` runtime flag mirror lives near `0x1CF758C`.

## Camera signature

Renzokuken is the clearest example of a **compound** camera action (see [[projects/re-ff8/concepts/battle-camera-architecture]]). A single limit interleaves both camera-ownership modes:

| Segment | `dword_1D97704` | `cameraRelated_pointerAnimColl` | Mode |
| --- | --- | --- | --- |
| Approach | `0x801F` (`0x8000` set) | `0x18080` / `0x18001` | full takeover (like GF) |
| Gunblade slashes | `0x1F` | `0x18002` / `0x18001`, `word_1D977A2` ramps `0`→`3840` | overlay (like magic) |
| Finisher | `0x801F` (`0x8000` set) | `0x18080` / `0x18001` | full takeover |
| End | `0x1F` | `0x10000` | idle restored exactly |

This is the evidence that `dword_1D97704.0x8000` is the **generic full-takeover bit**, not GF-specific.

## Address summary

| Symbol | Address |
| --- | --- |
| `BattleLimitRenzokuken_SetFinisherAndComputeTargetMask` | `0x48F270` |
| `ComputeRenzokukenDamage` (finisher hit loop) | `0x48F350` |
| `getRenzokukenFinisherText` | `0x47E5F0` |
| `byte_1D28E2E` (selected finisher idx) | `0x1D28E2E` |
| `K_RENZOKUKEN_FINISHER` mirror | `0x1CF758C` |
| `SG_RENZOKUKEN_AUTO` (bit0 = auto) | `0x1CFE978` |
| `SG_RENZOKUKEN_INDICATOR` | `0x1CFE979` |
| Trigger key binding (keyboard) | `0x1D2A2DC` |

## Related

- [[projects/re-ff8/concepts/limit-break-architecture]] (parent)
- [[projects/re-ff8/concepts/input-configuration]]
- [[projects/re-ff8/concepts/battle-camera-architecture]]
- [[projects/re-ff8/concepts/command-action-pipeline]]

## Runtime-Pending

- The exact per-window timing logic and how a Trigger press increments the hit counter (the slash-window state machine) is named but not byte-traced.^[ambiguous]
- The crisis-to-finisher selection weighting (which finisher index `byte_1D28E2E` receives) is not closed.^[ambiguous]
