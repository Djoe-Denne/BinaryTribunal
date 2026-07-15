---
title: GF Chain Completion And Support Assertions Investigation
summary: Static IDA reconstruction resolves several previously partial GF chain links - especially Doomtrain, Cactuar, Brothers, Alexander, Bahamut, and Eden - and narrows support/status GF validation toward exact durable status deltas instead of enemy HP loss, while fresh runtime payload capture remains blocked in the current non-debug MCP session.
tags: [ff8, gforce, reverse-engineering, testing, reference]
sources:
  - ai-prompt/todo/ai_investigation_on_gf_chain_completion_and_support_assertions.md
  - docs/tech/gforce/gf_catalog.md
  - docs/tech/gforce/gf_families.md
  - docs/tech/gforce/gf_cerberus_deep.md
  - docs/tech/reference/status_bits.md
  - ff8re/assertions.py
  - ff8re/tests/tier3_inject/GF_CARBUNCLE_001.yaml
  - ff8re/tests/tier3_inject/GF_CERBERUS_001.yaml
  - ff8re/tests/tier3_inject/GF_SIREN_001.yaml
  - ff8re/tests/tier3_inject/GF_SIREN_002.yaml
  - ff8re/tests/tier3_inject/GF_DOOMTRAIN_001.yaml
provenance:
  extracted: 0.78
  inferred: 0.14
  ambiguous: 0.08
---

# GF Chain Completion And Support Assertions Investigation

This staging note extends [[projects/re-ff8/concepts/gforce-catalog-and-families]], [[projects/re-ff8/concepts/gforce-cinematic-architecture]], and [[projects/re-ff8/references/gf-runtime-test-matrix]] with a static-only pass over still-partial GF chains plus a cleanup of support/status assertion rules.

## Confirmed Conclusions

- `GF_191Doomtrain_SequenceTick` and `GF_199Cactuar_SequenceTick` are wrapper ticks, not full cinematic drivers. Each one polls a secondary task list and returns `2` only after its dedicated driver drains.
- The missing driver links are now confirmed as `GF_191Doomtrain_SequenceTaskDriver` (`0x63F2D0`) and `GF_199Cactuar_SequenceTaskDriver` (`0x5A8940`).
- `GF_205Brothers_SequenceTick`, `GF_204Alexander_SequenceTick`, `GF_202Bahamut_SequenceTick`, and Eden's raw tick block at `0xAE3470` all use the same single-task `FamilyB` completion formula. They should no longer be treated as unresolved `Atypical` entries.
- Support/status GF validation must be anchored on durable status deltas on the correct side of the battle state, not on enemy HP loss.
- `ff8re/assertions.py` currently exposes `slot_status_any_added` and `slot_hp_decreased_if_alive`, but it does **not** expose `slot_status_all_added`. Exact multi-status assertions therefore require either multiple top-level checks or a new runner helper.
- The current MCP session is static-only: no `dbg_*` tools are exposed, and live addresses such as `K_GF_JUNCTIONABLE` at `0x1CF4DC0` do not yield real runtime payload bytes from the IDB alone in this session. Exact uncaptured status masks remain blocked until runtime or an offline kernel dump mapping is available.

## Chain Completion Matrix

| GF / cluster | Entry or init evidence | Tick / driver evidence | Counter evidence | Completion evidence | Result |
| --- | --- | --- | --- | --- | --- |
| Carbuncle | `GF_277Carbuncle_InvokeSummonScript` (`0x680C50`) and separate init path | `GF_277Carbuncle_SequenceTick` (`0x680DF0`) spawns and supervises `GF_277Carbuncle_SequenceTaskDriver` (`0x681630`) | main tick `0x6811C8`; driver `0x681FB0` | main tick `0x6811BE`; driver returns `2` at `0x681FC4` once frame counter reaches `283` | `FamilyA` confirmed |
| Siren | `GF_095Siren_InvokeSummonScript` (`0x739DA0`) feeds `BdLinkTask_CreateAndInitContext` (`0x8DC540`) | `GF_095Siren_SequenceTick` (`0x739F40`) is the GF-specific tick passed through shared init | `0x73A0A1` and `0x73A0A5` | shared helper `0x8DC530`, then `mov eax, 2; retn` at `0x73A0BD..0x73A0C2` | `SharedInit` chain confirmed |
| Doomtrain | `GF_191Doomtrain_InvokeSummonScript` (`0x63E730`) creates two task lists | wrapper tick `GF_191Doomtrain_SequenceTick` (`0x6472C0`) polls task list `dword_24FC330`, whose driver is now confirmed as `GF_191Doomtrain_SequenceTaskDriver` (`0x63F2D0`) | wrapper tick `0x6472D1`; driver increments `*(_WORD *)(a1 + 12)` every frame | wrapper returns `2` at `0x6472DE` once `BdlinkTask(dword_24FC330)` drains; driver returns `2` after frame counter passes `423` | `FamilyA` wrapper confirmed |
| Cactuar | `GF_199Cactuar_InvokeSummonScript` (`0x5A8750`) creates two task lists | wrapper tick `GF_199Cactuar_SequenceTick` (`0x5AA3A0`) polls task list `dword_2259A08`, whose driver is now confirmed as `GF_199Cactuar_SequenceTaskDriver` (`0x5A8940`) | wrapper tick `0x5AA3B1`; driver increments `*(_WORD *)(a1 + 12)` every frame | wrapper returns `2` at `0x5AA3BE` once `BdlinkTask(dword_2259A08)` drains; driver returns `2` after frame counter passes `151` | driver-delegated family confirmed |
| Brothers | single-task entry already named | `GF_205Brothers_SequenceTick` (`0xAF4B90`) matches the shared single-task script-driven pattern | `0xAF4B9A` | common completion formula returns `2` at `0xAF4DA4` | reclassify to `FamilyB` |
| Alexander | single-task entry already named | `GF_204Alexander_SequenceTick` (`0xB00310`) matches the shared single-task script-driven pattern | `0xB0031A` | common completion formula returns `2` at `0xB00524` | reclassify to `FamilyB` |
| Bahamut | single-task entry already named | `GF_202Bahamut_SequenceTick` (`0xB19010`) matches the shared single-task script-driven pattern | `0xB1901A` | common completion formula returns `2` at `0xB19224` | reclassify to `FamilyB` |
| Eden | `GF_206Eden_InvokeSummonScript` (`0xAE2DD0`) explicitly registers `GF_206Eden_SequenceTick` via `BdLinkTask(dword_2796CF8, tick)` | raw code label `0xAE3470` is the tick body even though it is not yet lifted as a standalone function in the IDB | `0xAE347A` | common completion formula ends at `0xAE3678..0xAE3684`, with terminal `and eax, 2; retn` at `0xAE3681..0xAE3684` | reclassify to `FamilyB` |

## Family Invariants Locked Down

### `FamilyB` single-task invariants

The following cluster is now statically consistent: Brothers, Alexander, Bahamut, and Eden.

- Entry registers a single tick task directly.
- Tick increments the sequence counter itself.
- Tick resolves shared `g_GfCinematic_*` pointers and performs the whole frame step.
- Completion uses the shared formula:

  `return ((unsigned int)~*(WORD*)(statePtr + 10) >> 14) & 2;`

This makes these entries architectural siblings of the already-confirmed Cerberus chain, even if their helper callees differ.

### `FamilyA` wrapper invariants

Carbuncle, Doomtrain, and Cactuar all show the same higher-level shape:

- entry builds a short top-level tick plus a larger secondary task list,
- wrapper tick mostly increments a small counter and polls the secondary list,
- real timeline work lives in a dedicated driver that owns the long frame counter,
- wrapper tick returns `2` only after the secondary list stops producing work.

That pattern closes the “missing link” gap for Doomtrain and Cactuar in the current catalog.

## Support And Status Assertion Library

### Support / party-buff GFs

#### Carbuncle (`command_arg = 0x46`)

- Target side: party slots `0..2`
- Durable effect: `Reflect`
- Durable storage: `status_2` bit `0x00000080`
- Correct assertion shape: ally status delta, **not** enemy HP delta

`GF_CARBUNCLE_001` already follows the right semantic shape because it snapshots party slots and checks `Reflect` additions instead of enemy HP loss.

#### Cerberus (`command_arg = 0x49`)

- Target side: party slots `0..2`
- Durable effect: `Double` + `Triple`
- Durable storage: `status_2` bits `0x00020000` and `0x00040000`
- Combined confirmed payload from existing project evidence: `0x00060000`
- Damage expectation: `0` HP delta is valid because Cerberus is a support GF with `gfPower = 0`

The key invariant is that `bp_apply_damage` can still fire even when HP does not change, because the normal resolve/apply path is also how the status payload is committed.

### Status / debuff GFs

#### Siren (`command_arg = 0x43`)

- Target side: enemy slots
- Durable effect worth asserting: `Silence`
- Durable storage: `status_1` bit `0x00000010`

The current broad “any negative status” bucket is weaker than necessary; existing project evidence already points specifically to `Silence`.

#### Doomtrain (`command_arg = 0x4B`)

- Target side: enemy slots
- Correct semantic mode: status-oriented, not HP-oriented
- Exact `HIT_STATUS_1` / `HIT_STATUS_2` mask: still blocked in this pass ^[ambiguous]

So the current “any expected debuff was added” pattern is directionally correct, but it should not yet be promoted to an exact bitmask claim.

## YAML Changes Needed

### Immediate YAML-only improvements

- `GF_CERBERUS_001`
  - Replace the current broad positive-status bucket (`Double`, `Triple`, `Haste`, `Protect`, `Shell`, `Reflect`, `Aura`) with **two separate top-level assertions**:
    - one `any_of` block requiring `Double` on at least one ally,
    - one `any_of` block requiring `Triple` on at least one ally.
  - Keep `bp_apply_damage`; do **not** add enemy HP assertions.

- `GF_SIREN_001`
  - Narrow the status list from a generic negative-status bucket to `["Silence"]`.

- `GF_CARBUNCLE_001`
  - No semantic assertion change is required in this pass. Its current ally-side `Reflect` check is the correct support-GF pattern.

- `GF_DOOMTRAIN_001`
  - Keep the status-oriented structure, but do not pretend the exact bitmask is known yet.

### Small runner enhancement worth scheduling

If the project wants exact support/status assertions without verbose duplication, add a new FF8 assertion helper such as `slot_status_all_added`. ^[inferred]

That would let the tests express:

- “the same ally gained both `Double` and `Triple`,”
- “all targeted allies gained `Reflect`,”
- “the exact status set matches the GF payload.”

Without that helper, the current runner can only express “any of these statuses appeared” via `slot_status_any_added`.

## IDA Updates Applied In This Pass

### Renames

- `0x63F2D0` -> `GF_191Doomtrain_SequenceTaskDriver`
- `0x5A8940` -> `GF_199Cactuar_SequenceTaskDriver`

### Comments

- `0x6472C0` — Doomtrain wrapper tick delegates to the secondary driver task list and returns `2` when it drains.
- `0x63F2D0` — Doomtrain secondary driver returns `2` after its local frame counter passes `423`.
- `0x5AA3A0` — Cactuar wrapper tick delegates to the secondary driver task list and returns `2` when it drains.
- `0x5A8940` — Cactuar secondary driver returns `2` after its local frame counter passes `151`.
- `0xAE2DD0` — Eden entry registers raw code label `0xAE3470` as a single-task `FamilyB` tick.
- `0xAE3470` — Eden raw tick block comment with counter and completion ranges.

## Exact Blocker

This pass cannot close the remaining runtime-dependent gaps from the current MCP session:

1. No `dbg_*` debugger tools are exposed by the current `user-ida-pro-mcp` toolset, so no live in-battle summon injection, breakpoint stepping, or readback capture can be run from here.
2. The project documents `K_GF_JUNCTIONABLE` at `0x1CF4DC0` as a live battle address. In this static-only IDB session, direct byte reads at that address space resolve to filler bytes rather than real runtime kernel payloads.
3. As a result, the following items remain blocked until runtime or an offline kernel-data mapping is available:
   - fresh authentic pending-write confirmation for still-unverified command args,
   - exact uncaptured status payloads such as Doomtrain's full bitmask,
   - live “all targeted allies/enemies actually received the same status set” proof for stricter YAML promotion.

## Merge Readiness

This staging note is ready to merge as:

- a catalog correction for the missing chain links above,
- an assertion-policy note for support/status GFs,
- an IDA annotation delta already applied to the current IDB.

The only part that should remain explicitly blocked after merge is fresh runtime payload capture for still-unread live kernel data. ^[ambiguous]

## Related

- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]]
- [[projects/re-ff8/references/gf-runtime-test-matrix]]
- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/re-ff8/references/research-prompt-backlog]]
