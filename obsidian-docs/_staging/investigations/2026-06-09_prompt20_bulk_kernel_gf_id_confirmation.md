---
title: Prompt 20 - Bulk Kernel GF ID Confirmation
summary: Static IDA analysis confirms the K_GF_JUNCTIONABLE base, stride, indexing rule, and high-signal field layout, but this IDB session does not expose the concrete 16-entry payload because direct reads at the table base return 0xFF filler bytes.
tags:
  - ff8
  - gforce
  - reverse-engineering
  - runtime-memory
  - reference
sources:
  - ai-prompt/todo/ai_investigation.md
  - docs/tech/reference/battle_action_resolve.h
  - docs/tech/reference/kernel_tables.md
  - docs/tech/reference/magic_effect_table.md
  - docs/tech/reference/command_id_table.md
  - docs/tech/test/test_gf_injection.md
  - "IDA MCP: decompile/disasm/read_struct/py_eval on 0x48FE20, 0x495070, 0x1CF4DC0"
provenance:
  extracted: 0.76
  inferred: 0.14
  ambiguous: 0.10
---

# Prompt 20 - Bulk Kernel GF ID Confirmation

This staging note complements [[projects/re-ff8/references/battle-slot-and-command-layouts]], [[projects/re-ff8/concepts/gforce-cinematic-architecture]], [[projects/re-ff8/concepts/damage-status-pipeline]], and [[projects/re-ff8/concepts/gforce-catalog-and-families]].

## Outcome

- `K_GF_JUNCTIONABLE` is confirmed in IDA at `0x1CF4DC0`.
- The table shape is confirmed as 16 entries with stride `0x84` / 132 bytes.
- The GF resolver indexes it with `gf_index = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID - 0x40`.
- The current IDB session does not expose the real per-entry payload: direct reads at the base return `0xFF` filler bytes, so a true bulk field dump cannot be regenerated from this session alone.
- No correction surfaced for Carbuncle `0x46` or Pandemona `0x48`; both remain consistent with the local documentation set.

> [!warning] Exact blocker
> This IDA session proves the table address, stride, type, and access pattern, but not the concrete entry bytes. `ida_bytes.get_byte(0x1CF4DC0)` and `read_struct(FF8KernelJunctionableGF)` both read back `0xFF`-filled data for the first entries, and the debugger is not attached in this session. A live runtime memory view or a section-14 `kernel.bin` dump is required to finish the "bulk dump all 16 entries" part without inventing data.

## Confirmed In IDA

### Resolver indexing

`BattleAction_ResolveAndApplyDamage` at `0x48FE20` proves the junctionable GF indexing path:

- Case `COMMAND_TYPE_ID == 0xFE` loads GF metadata from `K_GF_JUNCTIONABLE`.
- The index expression is `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID - 0x40`.
- The byte offset is `((idx << 5) + idx) << 2`, which reduces to `idx * 0x84`.

The same function also proves which fields feed the damage/status pipeline:

- `element` -> `HIT_ELEMENT`
- `statusAttackEnabler` -> `HIT_ATTACK_ENABLER`
- `statuses0` -> `HIT_STATUS_1`
- `statuses1` -> `HIT_STATUS_2`
- `attackFlags` -> `ATTACK_FLAG`
- `unknown2` -> `HIT_TYPE_TARGET_ANIMATION_TO_PLAY`
- `attackType` + `gfPower` -> `Damage_ComputeRawDeltaFromAttackType(...)`
- `powerMod` / `levelMod` -> `GF_POWER_MOD` / `GF_LEVEL_MOD`

### Name lookup helper

`0x495070` now renamed in IDA to `getAddressJunctionableGfAttackNameByCommandArg`.

That helper proves that:

- the same `command_arg - 0x40` indexing rule is reused outside the damage resolver,
- field `offsetGFAttackName` lives at struct offset `+0x00`,
- the name text comes from `KERNEL_HEADER.offsetJunctionableGFText`.

### Typed structure present in IDA

IDA already contains `FF8KernelJunctionableGF` with size `132`, and `read_struct` exposes the following high-signal layout:

| Offset | Field | Role |
| --- | --- | --- |
| `+0x00` | `offsetGFAttackName` | Name lookup via `getAddressJunctionableGfAttackNameByCommandArg` |
| `+0x02` | `offsetGFAttackDescription` | Description lookup slot |
| `+0x04` | `magicID` | 1-based `effect_id` for `MagicList_Logic` |
| `+0x06` | `attackType` | Damage formula dispatch key |
| `+0x07` | `gfPower` | GF power input |
| `+0x0A` | `attackFlags` | Resolver attack flags |
| `+0x0B` | `unknown2` | Target animation selector |
| `+0x0D` | `element` | Hit element |
| `+0x0E` | `statuses0` | `status_1` payload |
| `+0x10` | `statuses1` | `status_2` payload |
| `+0x1B` | `statusAttackEnabler` | Status-application gate |
| `+0x1C..+0x6F` | `abilityData[21]` | GF ability payload block, not used by the resolver path shown here.^[inferred] |
| `+0x70..+0x7F` | per-GF compatibility bytes | Compatibility matrix block.^[inferred] |
| `+0x82` | `powerMod` | GF damage modifier |
| `+0x83` | `levelMod` | GF level modifier |

## 16 Entry Mapping

The command-arg mapping itself is now stable:

- `command_arg` is a contiguous range `0x40..0x4F`.
- `gf_index = command_arg - 0x40`.
- The local documentation set consistently maps those 16 indices to the standard junctionable GF order.

The `effect_id` column below comes from `docs/tech/reference/magic_effect_table.md`, which explicitly states that the values are sourced from `K_GF_JUNCTIONABLE.magicID` in kernel section 14. Those values were not re-dumped from raw bytes in the current IDA session because of the blocker above.

| gf_index | command_arg | GF | effect_id | Existing local evidence |
| --- | --- | --- | --- | --- |
| 0 | `0x40` | Quezacotl | 116 | `magic_effect_table.md`, `test_gf_injection.md` |
| 1 | `0x41` | Shiva | 185 | `magic_effect_table.md`, `test_gf_injection.md` |
| 2 | `0x42` | Ifrit | 201 | static mapping + prior BP capture |
| 3 | `0x43` | Siren | 95 | `magic_effect_table.md`, `test_gf_injection.md` |
| 4 | `0x44` | Brothers | 205 | `magic_effect_table.md`, `test_gf_injection.md` |
| 5 | `0x45` | Diablos | 325 | static mapping + prior runtime confirmation |
| 6 | `0x46` | Carbuncle | 278 | static mapping + local docs stay consistent |
| 7 | `0x47` | Leviathan | 6 | `magic_effect_table.md`, `test_gf_injection.md` |
| 8 | `0x48` | Pandemona | 291 | static mapping + prior runtime confirmation |
| 9 | `0x49` | Cerberus | 203 | static mapping + prior runtime confirmation |
| 10 | `0x4A` | Alexander | 204 | `magic_effect_table.md`, `test_gf_injection.md` |
| 11 | `0x4B` | Doomtrain | 191 | `magic_effect_table.md`, `test_gf_injection.md` |
| 12 | `0x4C` | Bahamut | 202 | `magic_effect_table.md`, `test_gf_injection.md` |
| 13 | `0x4D` | Cactuar | 199 | `magic_effect_table.md`, `test_gf_injection.md` |
| 14 | `0x4E` | Tonberry | 90 | `magic_effect_table.md`, `test_gf_injection.md` |
| 15 | `0x4F` | Eden | 206 | `magic_effect_table.md`, `test_gf_injection.md` |

## What Prompt 20 Can Safely Claim Now

- `K_GF_JUNCTIONABLE` base is `0x1CF4DC0`.
- The stride is `0x84`.
- The count is 16.
- The resolver and GF-name helper both use `command_arg - 0x40`.
- `command_arg = 0x40 + gf_index` remains the correct mapping for the 16 junctionable GFs.
- Carbuncle `0x46` and Pandemona `0x48` remain supported; no contrary evidence surfaced.

## What Is Still Missing

The missing part is the raw 16-entry payload dump:

- `magicID`
- `attackType`
- `gfPower`
- `attackFlags`
- `element`
- `statusAttackEnabler`
- `statuses0`
- `statuses1`
- `powerMod`
- `levelMod`

for all 16 rows, re-read directly from the current session rather than inherited from earlier docs.

That requires one of:

1. a live debugger-attached IDA session with the kernel payload materialized at the expected address, or
2. an explicit `kernel.bin` section-14 dump/extractor available in the repo.

Whether the current `0xFF` bytes reflect an intentionally stubbed IDB region or a not-yet-materialized runtime load remains unresolved.^[ambiguous]

## Merge Notes

- Safe to merge the static confirmations into `[[projects/re-ff8/references/battle-slot-and-command-layouts]]`.
- Safe to mention the renamed helper `getAddressJunctionableGfAttackNameByCommandArg` in a future reference page or address catalog update.
- Do not merge any "full 16-row raw dump" claim from this note unless the blocker above is resolved first.
